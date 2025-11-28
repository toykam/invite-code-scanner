import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// GET all admins
export const GET = async (req: Request) => {
    try {
        const admins = await prisma.admin.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            message: 'Admins fetched successfully',
            admins
        }, { status: 200 });

    } catch (error) {
        console.log("Error fetching admins:", error);
        return NextResponse.json({
            message: "Failed to fetch admins"
        }, { status: 500 });
    }
};

// POST create new admin
export const POST = async (req: Request) => {
    try {
        const { name, email, password, role } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({
                message: "Missing required fields: name, email, password"
            }, { status: 400 });
        }

        // Check if admin already exists
        const existingAdmin = await prisma.admin.findUnique({
            where: { email }
        });

        if (existingAdmin) {
            return NextResponse.json({
                message: "Admin with this email already exists"
            }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.admin.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'admin'
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        return NextResponse.json({
            message: 'Admin created successfully',
            admin
        }, { status: 201 });

    } catch (error) {
        console.log("Error creating admin:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({
            message: "Failed to create admin",
            error: process.env.NODE_ENV === "development" ? errorMessage : undefined
        }, { status: 500 });
    }
};
