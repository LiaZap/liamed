interface VacancyWhatsAppData {
    title: string;
    description: string;
    sector: string;
    specialty?: string | null;
    contactEmail?: string | null;
    contactWhatsapp?: string | null;
    clinicName?: string | null;
    imageUrl?: string | null; // Full public URL
}

/**
 * Formats phone number to international format (5511999999999)
 */
function formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    // If already has country code (55), return as-is
    if (digits.startsWith('55') && digits.length >= 12) {
        return digits;
    }
    // Add Brazil country code
    return `55${digits}`;
}

/**
 * Builds the WhatsApp message text for a vacancy notification
 */
function buildVacancyMessage(vacancy: VacancyWhatsAppData): string {
    const desc = vacancy.description.length > 300
        ? vacancy.description.substring(0, 300) + '...'
        : vacancy.description;

    const contactParts: string[] = [];
    if (vacancy.contactEmail) contactParts.push(`Email: ${vacancy.contactEmail}`);
    if (vacancy.contactWhatsapp) contactParts.push(`WhatsApp: ${vacancy.contactWhatsapp}`);

    const lines = [
        `*Nova Vaga na LIAMED!*`,
        ``,
        `*${vacancy.title}*`,
        ``,
        desc,
        ``,
        `*Setor:* ${vacancy.sector}`,
    ];

    if (vacancy.specialty) {
        lines.push(`*Especialidade:* ${vacancy.specialty}`);
    }
    if (vacancy.clinicName) {
        lines.push(`*Clínica:* ${vacancy.clinicName}`);
    }
    if (contactParts.length > 0) {
        lines.push(``, `*Contato:*`, ...contactParts);
    }

    lines.push(``, `Acesse a plataforma para mais detalhes.`);

    return lines.join('\n');
}

/**
 * Sends a WhatsApp message with vacancy info (image + text or text only)
 * via UaZapi API. Non-blocking: catches errors and logs.
 */
export async function sendVacancyWhatsApp(
    phone: string,
    vacancy: VacancyWhatsAppData
): Promise<void> {
    const UAZAPI_URL = process.env.UAZAPI_URL;
    const UAZAPI_TOKEN = process.env.UAZAPI_TOKEN;

    if (!UAZAPI_URL || !UAZAPI_TOKEN) {
        console.warn('[WHATSAPP] UAZAPI_URL or UAZAPI_TOKEN not configured, skipping');
        return;
    }

    const formattedPhone = formatPhone(phone);
    const text = buildVacancyMessage(vacancy);

    try {
        let endpoint: string;
        let body: Record<string, string>;

        if (vacancy.imageUrl) {
            // Send image with caption
            endpoint = `${UAZAPI_URL}/send/media`;
            body = {
                number: formattedPhone,
                type: 'image',
                file: vacancy.imageUrl,
                text,
            };
        } else {
            // Text only
            endpoint = `${UAZAPI_URL}/send/text`;
            body = {
                number: formattedPhone,
                text,
            };
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'token': UAZAPI_TOKEN,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[WHATSAPP] UaZapi error (${response.status}) for ${formattedPhone}:`, errorText);
            return;
        }

        console.log(`[WHATSAPP] Vacancy notification sent to ${formattedPhone}`);
    } catch (error) {
        console.error(`[WHATSAPP] Failed to send to ${formattedPhone}:`, error);
    }
}
