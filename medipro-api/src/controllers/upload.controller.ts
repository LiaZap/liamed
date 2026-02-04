import { Request, Response } from 'express';

export const uploadFile = (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  // Construct standard URL (assumes server serves /uploads)
  // In production with S3 this would be different, but for local/VM fs:
  // Return relative path so frontend uses its own domain/proxy handling correctly
  const fileUrl = `/uploads/${req.file.filename}`;

  return res.json({
    message: 'Upload realizado com sucesso!',
    filename: req.file.filename,
    url: fileUrl
  });
};
