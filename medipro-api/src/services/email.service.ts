import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

interface VacancyEmailData {
    title: string;
    description: string;
    sector: string;
    specialty?: string | null;
    contactEmail?: string | null;
    contactWhatsapp?: string | null;
    clinicName?: string | null;
}

export const sendVacancyNotificationEmail = async (to: string, userName: string, vacancy: VacancyEmailData) => {
    const vagasLink = `${process.env.FRONTEND_URL}/vagas`;

    const contactInfo = [
        vacancy.contactEmail ? `Email: ${vacancy.contactEmail}` : '',
        vacancy.contactWhatsapp ? `WhatsApp: ${vacancy.contactWhatsapp}` : '',
    ].filter(Boolean).join(' | ');

    const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'LIAMED'}" <${process.env.EMAIL_FROM}>`,
        to,
        subject: `Nova Vaga: ${vacancy.title} - LIAMED`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0066CC;">LIAMED - Nova Vaga Disponível</h2>
                <p>Olá, <strong>${userName}</strong>!</p>
                <p>Uma nova vaga compatível com sua especialidade foi publicada:</p>
                <div style="background-color: #f8f9fa; border-left: 4px solid #0066CC; padding: 16px; margin: 20px 0; border-radius: 4px;">
                    <h3 style="margin: 0 0 8px 0; color: #333;">${vacancy.title}</h3>
                    <p style="margin: 0 0 8px 0; color: #555;">${vacancy.description.substring(0, 200)}${vacancy.description.length > 200 ? '...' : ''}</p>
                    <p style="margin: 0; font-size: 13px; color: #777;">
                        <strong>Setor:</strong> ${vacancy.sector}
                        ${vacancy.specialty ? ` | <strong>Especialidade:</strong> ${vacancy.specialty}` : ''}
                        ${vacancy.clinicName ? ` | <strong>Clínica:</strong> ${vacancy.clinicName}` : ''}
                    </p>
                    ${contactInfo ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #777;"><strong>Contato:</strong> ${contactInfo}</p>` : ''}
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${vagasLink}" style="background-color: #0066CC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Ver Vaga na Plataforma</a>
                </div>
                <p style="font-size: 12px; color: #999; margin-top: 30px;">Você recebeu este email porque ativou notificações de vagas no LIAMED. Para desativar, acesse suas preferências na plataforma.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 11px; color: #aaa; text-align: center;">LIAMED - Inteligência Clínica</p>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('[EMAIL] Vacancy notification sent to %s: %s', to, info.messageId);
        return info;
    } catch (error) {
        console.error('[EMAIL] Error sending vacancy notification to', to, error);
        // Non-blocking: don't throw, just log
    }
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'LIAMED Suporte'}" <${process.env.EMAIL_FROM}>`,
        to,
        subject: 'Recuperação de Senha - LIAMED',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0066CC;">LIAMED - Recuperação de Senha</h2>
                <p>Você solicitou a redefinição de sua senha. Clique no botão abaixo para criar uma nova senha:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #0066CC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Redefinir Senha</a>
                </div>
                <p>Ou copie e cole o link abaixo no seu navegador:</p>
                <p style="color: #666;">${resetLink}</p>
                <p style="font-size: 12px; color: #999; margin-top: 30px;">Este link expira em 1 hora.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 11px; color: #aaa; text-align: center;">LIAMED - Inteligência Clínica</p>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};
