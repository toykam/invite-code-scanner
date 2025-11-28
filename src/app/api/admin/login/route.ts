import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// POST admin login
export const POST = async (req: Request) => {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({
                message: "Email and password are required"
            }, { status: 400 });
        }

        const admin = await prisma.admin.findUnique({
            where: { email, isActive: true }
        });

        if (!admin) {
            return NextResponse.json({
                message: "Invalid credentials"
            }, { status: 401 });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin.password);

        if (!isValidPassword) {
            return NextResponse.json({
                message: "Invalid credentials"
            }, { status: 401 });
        }

        return NextResponse.json({
            message: 'Login successful',
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        }, { status: 200 });

    } catch (error) {
        console.log("Error logging in admin:", error);
        return NextResponse.json({
            message: "Something went wrong"
        }, { status: 500 });
    }
};
