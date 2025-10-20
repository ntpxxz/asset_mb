// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { z } from "zod";

// สำหรับการแก้ (update) ให้ทุกฟิลด์เป็น optional (สะดวกต่อ partial updates)
const userUpdateSchema = z
  .object({
    firstname: z.string().min(1, "First name is required"),
    lastname: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters").optional(),
    phone: z.string().nullable().optional(),
    department: z.string().nullable().optional(),
    role: z.enum(["user", "admin"]).optional(),
    location: z.string().nullable().optional(),
    employee_id: z.string().nullable().optional(),
    manager: z.string().nullable().optional(),
    start_date: z.string().nullable().optional(),
    status: z.enum(["active", "inactive", "suspended"]).optional(),
  })
  .partial(); // <-- ทำให้ทุกฟิลด์ optional สำหรับการอัพเดต

// รองรับทั้งกรณี Next ให้ params เป็น object หรือ Promise<object>

type Ctx = { params: Promise<{ id: string }> };

// GET /api/users/[id]
export async function GET(request: NextRequest, context: Ctx) {
  // await context.params เสมอ เพื่อรองรับทั้ง sync/async shape
  const params = await context.params;
  const id = params.id;

  try {
    const result = await pool.query(
      `SELECT id, "firstname", "lastname", email, phone, department, role, location, "employee_id", "start_date", status, "assets_count"
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error(`Failed to fetch user ${id}:`, error);
    return NextResponse.json(
      { success: false, error: `Failed to fetch user ${id}`, details: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id]
export async function PUT(request: NextRequest, context: Ctx) {
  const params = await context.params;
  const id = params.id;

  try {
    const body = await request.json();
    const validation = userUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const fields = validation.data;
    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
    }

    // เพิ่ม updated_at
    (fields as any).updated_at = new Date().toISOString();

    // สร้าง SET clause แบบ dynamic (ระวัง SQL injection — ค่าใส่ผ่าน parameterized query)
    const keys = Object.keys(fields);
    const setClauses = keys.map((key, index) => `"${key}" = $${index + 1}`).join(", ");
    const queryParams = Object.values(fields);
    // พารามิเตอร์สุดท้ายเป็น id
    queryParams.push(id);
    const idParamIndex = queryParams.length; // เช่น $N

    const query = `UPDATE users SET ${setClauses} WHERE id = $${idParamIndex} RETURNING *;`;

    const result = await pool.query(query, queryParams);

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const updatedUser = result.rows[0];
    // ป้องกันส่ง password กลับไป
    if ("password" in updatedUser) {
      delete updatedUser.password;
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: "User updated successfully",
      redirect: "/users",
    });
  } catch (error: any) {
    console.error(`Failed to update user ${id}:`, error);

    if (error?.code === "23505") {
      return NextResponse.json(
        { success: false, error: "User with this email or employee ID already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: `Failed to update user ${id}`, details: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id]
export async function DELETE(request: NextRequest, context: Ctx) {
  const params = await context.params;
  const id = params.id;

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id;', [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.rows[0], message: "User deleted successfully" });
  } catch (error: any) {
    console.error(`Failed to delete user ${id}:`, error);
    return NextResponse.json(
      { success: false, error: `Failed to delete user ${id}`, details: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}
