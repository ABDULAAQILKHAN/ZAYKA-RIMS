"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus, Trash2, UserCog, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    role: z.enum(["staff", "manager", "rider"]),
})

interface StaffUser {
    id: string
    email: string
    full_name: string
    role: string
    created_at: string
    last_sign_in_at: string | null
    email_confirmed_at: string | null
    is_active: boolean
    is_banned: boolean
}

export default function StaffManagement() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [staffList, setStaffList] = useState<StaffUser[]>([])

    // Fetch staff list from API
    const fetchStaffList = async () => {
        setIsFetching(true)
        try {
            const response = await fetch("/api/admin/list-staff")
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch staff")
            }

            setStaffList(data.users || [])
        } catch (error) {
            console.error("Error fetching staff:", error)
            toast.error(error instanceof Error ? error.message : "Failed to load staff list")
        } finally {
            setIsFetching(false)
        }
    }

    useEffect(() => {
        fetchStaffList()
    }, [])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            role: "staff",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            const response = await fetch("/api/admin/create-staff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to create staff")
            }

            toast.success("Staff member invited! A magic link has been sent to their email.")
            setIsOpen(false)
            form.reset()

            // Refresh the staff list
            fetchStaffList()

        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    async function onDelete(userId: string) {
        if (!confirm("Are you sure you want to delete this user?")) return

        try {
            const response = await fetch(`/api/admin/delete-user?id=${userId}`, {
                method: "DELETE",
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to delete user")
            }

            toast.success("User deleted successfully")
            fetchStaffList()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete user")
        }
    }

    const getStatusBadge = (staff: StaffUser) => {
        if (staff.is_banned) {
            return (
                <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Banned
                </Badge>
            )
        }
        if (staff.is_active) {
            return (
                <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-3 w-3" />
                    Active
                </Badge>
            )
        }
        return (
            <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                Pending
            </Badge>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Employee Management</CardTitle>
                    <CardDescription className="mt-2">
                        Manage staff, managers, and riders.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={fetchStaffList} disabled={isFetching}>
                        <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                    </Button>
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Staff
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Employee</DialogTitle>
                                <DialogDescription>
                                    Invite a new team member. They will receive a magic link via email to set up their account.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Full Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="John Doe" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="john@example.com" type="email" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="role"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Role</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a role" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="staff">Staff</SelectItem>
                                                        <SelectItem value="manager">Manager</SelectItem>
                                                        <SelectItem value="rider">Rider</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {/* Password field not needed - using Magic Link
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <Input placeholder="******" type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                */}
                                    <p className="text-sm text-muted-foreground">
                                        The user will receive an email with a magic link to set up their account.
                                    </p>
                                    <DialogFooter>
                                        <Button type="submit" disabled={isLoading}>
                                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Send Invite
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {isFetching && staffList.length === 0 ? (
                    <div className="flex items-center justify-center h-24">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead>Last Login</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {staffList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            No staff members found. Click "Add Staff" to invite a new team member.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    staffList.map((staff) => (
                                        <TableRow key={staff.id}>
                                            <TableCell className="font-medium">
                                                {staff.full_name}
                                            </TableCell>
                                            <TableCell>{staff.email}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <UserCog className="h-4 w-4 text-muted-foreground" />
                                                    <span className="capitalize">{staff.role}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(staff)}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(staff.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                {staff.last_sign_in_at
                                                    ? new Date(staff.last_sign_in_at).toLocaleDateString()
                                                    : <span className="text-muted-foreground">Never</span>
                                                }
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => onDelete(staff.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
