import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
    const cookieStore = cookies()

    // 1. Verify the current user is an Admin
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    cookieStore.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    cookieStore.set({ name, value: '', ...options })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.user_metadata.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. List users using Service Role Key
    const serviceRoleKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
        return NextResponse.json({ error: 'Server configuration error: Missing Service Role Key' }, { status: 500 })
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    try {
        // Fetch all users
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({
            perPage: 100,
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        // Filter only staff, manager, and rider users
        const staffUsers = data.users.filter(
            (u) => u.user_metadata?.role === 'staff' || u.user_metadata?.role === 'manager' || u.user_metadata?.role === 'rider'
        ).map((u) => {

            // Access banned_until through unknown cast (exists in API but not in types)
            const userObj = u as unknown as { banned_until?: string }
            const isBanned = userObj.banned_until
                ? new Date(userObj.banned_until) > new Date()
                : false

            return {
                id: u.id,
                email: u.email,
                full_name: u.user_metadata?.full_name || 'N/A',
                role: u.user_metadata?.role || 'staff',
                created_at: u.created_at,
                last_sign_in_at: u.last_sign_in_at,
                email_confirmed_at: u.email_confirmed_at,
                // User is active if they have confirmed email OR have signed in at least once
                is_active: !!(u.email_confirmed_at || u.last_sign_in_at),
                is_banned: isBanned,
            }
        })

        return NextResponse.json({ users: staffUsers }, { status: 200 })

    } catch (error) {
        console.error('Error listing staff:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
