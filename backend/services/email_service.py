import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

from sqlalchemy.orm import Session

from utilities.config import settings
from models.models import SMTPLog

logger = logging.getLogger("costrasphere.smtp")
logging.basicConfig(level=logging.INFO)


def log_smtp(db: Session, recipient: str, subject: str, status: str, message: str = ""):
    entry = SMTPLog(recipient=recipient, subject=subject, status=status, message=message)
    db.add(entry)
    db.commit()


def send_email(db: Session, to_email: str, subject: str, html_body: str) -> bool:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.email_user
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    try:
        logger.info("SMTP connecting to smtp.gmail.com:587 for %s", to_email)
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.set_debuglevel(1)
            server.starttls()
            server.login(settings.email_user, settings.email_password)
            server.sendmail(settings.email_user, to_email, msg.as_string())
        logger.info("SMTP email sent successfully to %s", to_email)
        log_smtp(db, to_email, subject, "success", "Email delivered")
        return True
    except Exception as exc:
        logger.error("SMTP failed for %s: %s", to_email, exc)
        log_smtp(db, to_email, subject, "failed", str(exc))
        return False


def send_approval_request_email(db: Session, to_email: str, customer_name: str, company_name: str, project_name: str, approval_link: str) -> bool:
    """Send approval request email when customer sends approval to company."""
    subject = f"CostraSphere AI - Project Approval Request: {project_name}"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background: #f5f0ff; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 20px rgba(138,99,210,0.2);">
            <h2 style="color: #7c3aed;">CostraSphere AI - Project Approval Request</h2>
            <p>Hello {company_name} Team,</p>
            <p><strong>{customer_name}</strong> has sent an approval request for the project:</p>
            <p style="background: #f0e6ff; padding: 15px; border-left: 4px solid #7c3aed; border-radius: 4px;">
                <strong>Project Name:</strong> {project_name}<br/>
                <strong>Requested By:</strong> {customer_name}
            </p>
            <p>Please review the project details and either approve or reject the request.</p>
            <a href="{approval_link}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Click here to respond</a>
            <p style="color: #888; font-size: 12px; margin-top: 20px;">Sent at {datetime.utcnow().isoformat()} UTC</p>
            <br/>
            <p style="color: #7c3aed; font-weight: bold;">With Regards,<br/>Team Digital Dynamos 💜</p>
        </div>
    </body>
    </html>
    """
    return send_email(db, to_email, subject, html)


def send_approval_response_email(db: Session, to_email: str, customer_name: str, company_name: str, project_name: str, status: str) -> bool:
    """Send email when company approves or rejects a project."""
    status_color = "#22c55e" if status == "approved" else "#ef4444"
    status_text = "APPROVED ✓" if status == "approved" else "REJECTED ✗"
    subject = f"CostraSphere AI - Your Project {status_text}: {project_name}"
    
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background: #f5f0ff; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 20px rgba(138,99,210,0.2);">
            <h2 style="color: #7c3aed;">CostraSphere AI - Project Response</h2>
            <p>Hello {customer_name},</p>
            <p><strong>{company_name}</strong> has reviewed your project and the decision is:</p>
            <p style="background: {status_color}20; padding: 15px; border-left: 4px solid {status_color}; border-radius: 4px; font-size: 18px; font-weight: bold; color: {status_color};">
                {status_text}
            </p>
            <p><strong>Project:</strong> {project_name}</p>
            <p>Thank you for using CostraSphere AI. You can view your projects in the dashboard.</p>
            <p style="color: #888; font-size: 12px; margin-top: 20px;">Sent at {datetime.utcnow().isoformat()} UTC</p>
            <br/>
            <p style="color: #7c3aed; font-weight: bold;">With Regards,<br/>Team Digital Dynamos 💜</p>
        </div>
    </body>
    </html>
    """
    return send_email(db, to_email, subject, html)


def send_otp_email(db: Session, to_email: str, otp_code: str, purpose: str) -> bool:
    subject = f"CostraSphere AI - Your OTP for {purpose.replace('_', ' ').title()}"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background: #f5f0ff; padding: 20px;">
        <motion.div style="max-width: 500px; margin: auto; background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 20px rgba(138,99,210,0.2);">
            <h2 style="color: #7c3aed;">CostraSphere AI</h2>
            <p>Your verification code is:</p>
            <h1 style="color: #7c3aed; letter-spacing: 8px;">{otp_code}</h1>
            <p>This OTP expires in {settings.otp_expire_minutes} minutes.</p>
            <p style="color: #888; font-size: 12px;">Sent at {datetime.utcnow().isoformat()} UTC</p>
            <br/>
            <p style="color: #7c3aed; font-weight: bold;">With Regards,<br/>Team Digital Dynamos 💜</p>
        </motion.div>
    </body>
    </html>
    """
    return send_email(db, to_email, subject, html)
