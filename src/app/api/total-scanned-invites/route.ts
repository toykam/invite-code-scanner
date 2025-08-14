import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server"


export const GET = async (req: Request) => {
    try {

        const totalScanned = await prisma.invite.count();

        return NextResponse.json({
            'message': 'Total Scanned Fetched Successfully',
            'totalScanned': totalScanned
        }, {status: 200});

    } catch (error) {
        console.log("Error getting total scanned invites:", error)
        return NextResponse.json({
            'message': "Something went wrong"
        }, {status: 500})
    }
}