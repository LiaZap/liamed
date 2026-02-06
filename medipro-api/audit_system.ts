
// Remove redeclaration of fetch if it exists in global scope, or use dynamic import/require
// For TS-node with DOM lib, fetch is global type but might need implementation
let fetch: any;
try {
    fetch = globalThis.fetch;
    if (!fetch) fetch = require('node-fetch');
} catch (e) {
    console.warn("Could not load fetch source");
}

const API_URL = 'http://localhost:3000';

async function verifyFlows() {
    console.log("🚀 Starting Pre-Production Audit...");
    let errors: string[] = [];

    // 1. Register Gestor (and create Clinic)
    const gestorEmail = `gestor_${Date.now()}@test.com`;
    const clinicName = `Clinic Auto ${Date.now()}`;
    
    console.log(`\n[TEST 1] Testing Gestor Registration & Clinic Creation...`);
    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: "Test Gestor",
                email: gestorEmail,
                password: "password123",
                role: "GESTOR",
                clinicName: clinicName,
                clinicPhone: "11999999999"
            })
        });
        
        const data = await res.json();
        
        if (res.status === 201 && data.token) {
            console.log("✅ Gestor Registered Successfully");
            console.log("   User ID:", data.user.id);
        } else {
            errors.push(`Gestor Registration Failed: ${res.status} - ${JSON.stringify(data)}`);
            console.error("❌ Failed:", data);
        }

    } catch (e: any) {
        errors.push(`Gestor Registration Exception: ${e.message}`);
        console.error("❌ Exception:", e);
    }

    // 2. Register Medico with INVALID Invite Code
    console.log(`\n[TEST 2] Testing Medico Invite with INVALID Code...`);
    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: "Dr. Invalid Code",
                email: `wrong_${Date.now()}@test.com`,
                password: "password123",
                role: "MEDICO",
                specialty: "Cardiologia",
                inviteCode: "INVALID-CODE-999"
            })
        });
        const data = await res.json();
        if (res.status === 400 && data.error && data.error.includes("inválido")) {
             console.log("✅ Correctly rejected invalid code");
        } else {
             errors.push(`Invalid Code Test Failed: Expected 400, got ${res.status}`);
             console.error("❌ Failed:", data);
        }
    } catch (e: any) {
        errors.push(`Invalid Code Test Exception: ${e.message}`);
    }

    // 3. Register Medico with VALID Invite Code
    // Summary
    console.log("\n--- Audit Summary ---");
    if (errors.length === 0) {
        console.log("✅ ALL CHECKS PASSED. Logic seems sound.");
    } else {
        console.log("⚠️ ISSUES FOUND:");
        errors.forEach(e => console.log(" - " + e));
    }
}

// Since we are in an environment where we can run TS-Node, let's use Prisma to verify data integrity too.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runFullAudit() {
    await verifyFlows();
    
    try {
        // DB Integrity Check
        console.log("\n[TEST 3] Verifying Database Records...");
        const recentClinics = await prisma.clinic.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        
        console.log(`Found ${recentClinics.length} recent clinics.`);
        if (recentClinics.length > 0) {
            const lastClinic = recentClinics[0];
            console.log(`Latest Clinic: ${lastClinic.name}, Code: ${lastClinic.inviteCode}`);
            if (!lastClinic.inviteCode) {
                 console.error("❌ CRITICAL: Latest clinic has NO invite code!");
            } else {
                 console.log("✅ Clinic has invite code.");
                 
                 // Now Try to Register with this code!
                 console.log(`\n[TEST 4] Registering Doctor with code ${lastClinic.inviteCode}...`);
                 const res = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: "Dr. Success",
                        email: `doctor_${Date.now()}@test.com`,
                        password: "password123",
                        role: "MEDICO",
                        specialty: "Dermatologia",
                        inviteCode: lastClinic.inviteCode
                    })
                });
                const data = await res.json();
                if (res.status === 201) {
                    // Check if linked
                    const newUser = await prisma.user.findUnique({ where: { id: data.user.id } });
                    if (newUser.clinicId === lastClinic.id) {
                         console.log("✅ Doctor successfully linked to clinic!");
                    } else {
                         console.error("❌ Doctor created but NOT linked to clinic!");
                    }
                } else {
                    console.error("❌ Failed to register with valid code:", data);
                }
            }
        }
    } catch(err) {
        console.error("DB Check failed:", err);
    }
}

runFullAudit();
