import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

BRAND = HexColor("#155E4F")
GOLD = HexColor("#C98B0B")
INK = HexColor("#16211D")
MUTED = HexColor("#6B7A73")
LINE = HexColor("#DEE5E1")
PAPER_ALT = HexColor("#F2F5F2")

STATUS_COLOR = {"completed": BRAND, "pending": GOLD, "failed": HexColor("#B3261E")}


def build_receipt_pdf(donation):
    """Render a single-page, branded donation receipt as PDF bytes."""
    buffer = io.BytesIO()
    page = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    donor = donation.donor
    cause = donation.cause

    # Header band
    page.setFillColor(BRAND)
    page.rect(0, height - 42 * mm, width, 42 * mm, fill=1, stroke=0)
    page.setFillColor(white)
    page.setFont("Helvetica-Bold", 20)
    page.drawString(20 * mm, height - 20 * mm, "Micro-Donations")
    page.setFont("Helvetica", 11)
    page.drawString(20 * mm, height - 28 * mm, "Official Donation Receipt")

    page.setFont("Helvetica", 9)
    page.drawRightString(width - 20 * mm, height - 20 * mm, f"Receipt #{donation.id}")
    page.drawRightString(
        width - 20 * mm, height - 26 * mm,
        donation.timestamp.strftime("%d %B %Y, %H:%M UTC"),
    )

    # Status chip
    status_label = donation.status.upper()
    page.setFont("Helvetica-Bold", 9)
    chip_width = page.stringWidth(status_label, "Helvetica-Bold", 9) + 12
    chip_x = width - 20 * mm - chip_width
    chip_y = height - 38 * mm
    page.setFillColor(white)
    page.roundRect(chip_x, chip_y, chip_width, 6.5 * mm, 3 * mm, fill=1, stroke=0)
    page.setFillColor(STATUS_COLOR.get(donation.status, INK))
    page.drawCentredString(chip_x + chip_width / 2, chip_y + 2.1 * mm, status_label)

    # Amount, large and central
    y = height - 62 * mm
    page.setFillColor(MUTED)
    page.setFont("Helvetica", 10)
    page.drawString(20 * mm, y, "AMOUNT DONATED")
    page.setFillColor(INK)
    page.setFont("Helvetica-Bold", 30)
    page.drawString(20 * mm, y - 12 * mm, f"${donation.amount:,.2f}")

    # Details box
    box_top = y - 22 * mm
    box_height = 46 * mm
    page.setFillColor(PAPER_ALT)
    page.roundRect(20 * mm, box_top - box_height, width - 40 * mm, box_height, 2 * mm, fill=1, stroke=0)

    rows = [
        ("Donor", f"{donor.name}" if donor else "—"),
        ("Email", donor.email if donor else "—"),
        ("Cause supported", cause.title if cause else "—"),
        ("Payment method", "M-Pesa" if donation.checkout_request_id else "Direct"),
    ]
    row_y = box_top - 9 * mm
    for label, value in rows:
        page.setFillColor(MUTED)
        page.setFont("Helvetica-Bold", 9)
        page.drawString(26 * mm, row_y, label.upper())
        page.setFillColor(INK)
        page.setFont("Helvetica", 11)
        page.drawString(70 * mm, row_y, str(value))
        row_y -= 9.5 * mm

    # Footer
    page.setStrokeColor(LINE)
    page.line(20 * mm, 28 * mm, width - 20 * mm, 28 * mm)
    page.setFillColor(MUTED)
    page.setFont("Helvetica-Oblique", 10)
    page.drawString(20 * mm, 20 * mm, "Thank you for supporting this cause — your generosity moves it forward.")
    page.setFont("Helvetica", 8)
    page.drawString(20 * mm, 14 * mm, "Micro-Donations Platform · This receipt confirms a completed donation.")

    page.setFillColor(black)  # reset, in case the canvas is reused
    page.showPage()
    page.save()
    return buffer.getvalue()
