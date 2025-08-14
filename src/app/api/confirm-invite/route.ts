import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server"


export const POST = async (req: Request) => {
    try {
        const { inviteCode } = await req.json();

        // a valid invite code must match this format for attendant FS25-3021, the number after FS25 is between 1000 and 3500
        const inviteCodePattern = /^FS25-(1[0-9]{3}|2[0-9]{3}|3[0-4][0-9]{2}|3500)$/;

        if (!inviteCodePattern.test(inviteCode)) {
            return NextResponse.json({
                'message': "Invalid invite code format"
            }, {status: 400});
        }

        let existingQrCode = await prisma.invite.findUnique({
            where: {inviteQrCode: inviteCode}
        });

        if (existingQrCode != null) {
            return NextResponse.json({
                'message': "Invite code already used"
            }, {status: 400});
        }

        existingQrCode = await prisma.invite.create({
            data: {
                inviteQrCode: inviteCode,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        const totalScanned = await prisma.invite.count();

        return NextResponse.json({
            'message': 'Welcome to the Event',
            'totalScanned': totalScanned
        }, {status: 200});

    } catch (error) {
        console.log("Error confirming invite:", error)
        return NextResponse.json({
            'message': "Something went wrong"
        }, {status: 500})
    }
}