import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
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

    // 2. Create the new Staff user using Service Role Key
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
        const body = await request.json()
        const { email, name, role = 'staff' } = body

        if (!email || !name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (role !== 'staff' && role !== 'manager' && role !== 'rider') {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
        }

        // Use inviteUserByEmail to send a magic link instead of creating with password
        const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: {
                role: role,
                full_name: name
            },
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login`
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ user: data.user, message: 'Invitation sent successfully' }, { status: 201 })

    } catch (error) {
        console.error('Error creating staff:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
