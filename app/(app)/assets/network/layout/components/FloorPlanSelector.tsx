'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export type FloorPlan = {
    id: number;
    name: string;
    image_url: string;
    level: number;
};

interface FloorPlanSelectorProps {
    selectedId: number | null;
    onSelect: (plan: FloorPlan | null) => void;
}

export function FloorPlanSelector({ selectedId, onSelect }: FloorPlanSelectorProps) {
    const [plans, setPlans] = useState<FloorPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form state
    const [newName, setNewName] = useState('');
    const [newLevel, setNewLevel] = useState('0');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await fetch('/api/floor-plans');
            if (res.ok) {
                const data = await res.json();
                setPlans(data);
                // If we have plans but none selected, select the first one
                if (data.length > 0 && !selectedId) {
                    onSelect(data[0]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch floor plans', error);
            toast.error('Failed to load floor plans');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !newName) {
            toast.error('Please provide a name and an image');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('name', newName);
        formData.append('level', newLevel);
        formData.append('image', selectedFile);

        try {
            const res = await fetch('/api/floor-plans', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const newPlan = await res.json();
                setPlans([...plans, newPlan]);
                onSelect(newPlan);
                setIsDialogOpen(false);
                setNewName('');
                setNewLevel('0');
                setSelectedFile(null);
                toast.success('Floor plan added successfully');
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to upload floor plan');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedId) return;

        if (!confirm('Are you sure you want to delete this floor plan? This will also remove all asset placements on it.')) {
            return;
        }

        try {
            const res = await fetch(`/api/floor-plans/${selectedId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                const updatedPlans = plans.filter(p => p.id !== selectedId);
                setPlans(updatedPlans);
                onSelect(updatedPlans.length > 0 ? updatedPlans[0] : null);
                toast.success('Floor plan deleted');
            } else {
                throw new Error('Delete failed');
            }
        } catch (error) {
            toast.error('Failed to delete floor plan');
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Select
                value={selectedId?.toString()}
                onValueChange={(val) => {
                    const plan = plans.find((p) => p.id === parseInt(val));
                    onSelect(plan || null);
                }}
            >
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Floor" />
                </SelectTrigger>
                <SelectContent>
                    {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id.toString()}>
                            {plan.name}
                        </SelectItem>
                    ))}
                    {plans.length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                            No floor plans
                        </div>
                    )}
                </SelectContent>
            </Select>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Plus className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Floor Plan</DialogTitle>
                        <DialogDescription>
                            Upload an image of the floor plan layout.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Floor Name</Label>
                            <Input
                                id="name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g. 1st Floor, Server Room"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="level">Level / Order</Label>
                            <Input
                                id="level"
                                type="number"
                                value={newLevel}
                                onChange={(e) => setNewLevel(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="image">Floor Plan Image</Label>
                            <Input
                                id="image"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={uploading}>
                                {uploading ? 'Uploading...' : 'Add Floor Plan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {selectedId && (
                <Button variant="destructive" size="icon" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
