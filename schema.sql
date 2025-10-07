
-- ======= CREATE TABLES =======
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    "firstName"   VARCHAR(255),
    "lastName"    VARCHAR(255),
    email         VARCHAR(255) UNIQUE NOT NULL,
    phone         VARCHAR(255),
    department    VARCHAR(255),
    role          VARCHAR(255),
    location      VARCHAR(255),
    "employeeId"  VARCHAR(255) UNIQUE,
    "startDate"   DATE,
    status        VARCHAR(50),
    "assetsCount" INT,
    "createdAt"   TIMESTAMP,
    "updatedAt"   TIMESTAMP
);

CREATE TABLE assets (
    id VARCHAR(255) PRIMARY KEY,
    "assetTag"        VARCHAR(255) UNIQUE NOT NULL,
    type              VARCHAR(255),
    manufacturer      VARCHAR(255),
    model             VARCHAR(255),
    "serialNumber"    VARCHAR(255) UNIQUE NOT NULL,
    "purchaseDate"    DATE,
    "purchasePrice"   DECIMAL(10,2),
    supplier          VARCHAR(255),
    "warrantyExpiry"  DATE,
    "assignedUser"    VARCHAR(255),
    location          VARCHAR(255),
    department        VARCHAR(255),
    status            VARCHAR(50),
    "operatingSystem" VARCHAR(255),
    processor         VARCHAR(255),
    memory            VARCHAR(255),
    storage           VARCHAR(255),
    hostname          VARCHAR(255),
    "ipAddress"       VARCHAR(255),
    "macAddress"      VARCHAR(255),
    "patchStatus"     VARCHAR(255),
    "lastPatchCheck"  DATE,
    "isLoanable"      BOOLEAN,
    condition         VARCHAR(255),
    description       TEXT,
    notes             TEXT,
    "createdAt"       TIMESTAMP,
    "updatedAt"       TIMESTAMP,
    FOREIGN KEY ("assignedUser") REFERENCES users(id)
);

CREATE TABLE software (
    id VARCHAR(255) PRIMARY KEY,
    "softwareName"     VARCHAR(255) NOT NULL,
    publisher          VARCHAR(255),
    version            VARCHAR(255),
    "licenseKey"       VARCHAR(255) UNIQUE NOT NULL,
    "licenseType"      VARCHAR(255),
    "purchaseDate"     DATE,
    "expiryDate"       DATE,
    "licensesTotal"    INT,
    "licensesAssigned" INT,
    category           VARCHAR(255),
    description        TEXT,
    notes              TEXT,
    status             VARCHAR(50),
    "createdAt"        TIMESTAMP,
    "updatedAt"        TIMESTAMP
);

CREATE TABLE asset_borrowing (
    id VARCHAR(255) PRIMARY KEY,
    "assetId"     VARCHAR(255) NOT NULL,
    "borrowerId"  VARCHAR(255) NOT NULL,
    "checkoutDate" DATE NOT NULL,
    "dueDate"      DATE,
    "checkinDate"  DATE,
    status         VARCHAR(50),
    purpose        VARCHAR(255),
    notes          TEXT,
    "createdAt"    TIMESTAMP,
    "updatedAt"    TIMESTAMP,
    FOREIGN KEY ("assetId")    REFERENCES assets(id),
    FOREIGN KEY ("borrowerId") REFERENCES users(id)
);

CREATE TABLE asset_patches (
    id VARCHAR(255) PRIMARY KEY,
    "assetId"         VARCHAR(255) NOT NULL,
    "patchStatus"     VARCHAR(50),
    "lastPatchCheck"  DATE,
    "operatingSystem" VARCHAR(255),
    vulnerabilities   INT,
    "pendingUpdates"  INT,
    "criticalUpdates" INT,
    "securityUpdates" INT,
    notes             TEXT,
    "nextCheckDate"   DATE,
    "createdAt"       TIMESTAMP,
    "updatedAt"       TIMESTAMP,
    FOREIGN KEY ("assetId") REFERENCES assets(id)
);
CREATE TABLE  asset_patch_history (
  id            VARCHAR(255) PRIMARY KEY,
  "patchId"     VARCHAR(255) NOT NULL,              -- FK ไปยัง asset_patches.id
  "patchName"   VARCHAR(255) NOT NULL,
  version       VARCHAR(255),
  description   TEXT,
  "patchType"   VARCHAR(20)  NOT NULL,              -- 'security' | 'critical' | 'feature' | 'bugfix'
  severity      VARCHAR(20)  NOT NULL,              -- 'low' | 'medium' | 'high' | 'critical'
  status        VARCHAR(20)  NOT NULL,              -- 'installed' | 'failed' | 'pending' | 'scheduled'
  "installDate" TIMESTAMP NULL,
  "scheduledDate" TIMESTAMP NULL,
  size          VARCHAR(50),
  "kbNumber"    VARCHAR(50),
  "cveIds"      TEXT,                               -- เก็บเป็น CSV/JSON string แล้ว parse ที่ API
  notes         TEXT,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_patch
    FOREIGN KEY("patchId") REFERENCES asset_patches(id),

  -- บังคับค่า enum ให้ตรงกับ UI
  CONSTRAINT chk_patchType
    CHECK ("patchType" IN ('security','critical','feature','bugfix')),
  CONSTRAINT chk_severity
    CHECK (severity IN ('low','medium','high','critical')),
  CONSTRAINT chk_status
    CHECK (status IN ('installed','failed','pending','scheduled'))
);

-- Indexes ที่ใช้ค้นหาบ่อย
CREATE INDEX  idx_aph_patchId ON asset_patch_history("patchId");
CREATE INDEX  idx_aph_status  ON asset_patch_history(status);
CREATE INDEX  idx_aph_type    ON asset_patch_history("patchType");

