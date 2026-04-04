#!/usr/bin/env python3
"""Generate a one-page PDF flyer for Park Forum: The Case for Bitcoin in Healthcare."""

import base64
import io
import os
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.expanduser("~/Library/Python/3.9/lib/python/site-packages"))
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.colormasks import SolidFillColorMask

# Generate QR code
qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=10, border=4)
qr.add_data("https://pay.zaprite.com/pl_XsT26aenI2")
qr.make(fit=True)
qr_img = qr.make_image(fill_color=(3, 17, 105), back_color=(255, 255, 255))
# Crop to exact square to ensure centering
from PIL import Image
qr_pil = qr_img.get_image()
w, h = qr_pil.size
size = max(w, h)
centered = Image.new("RGB", (size, size), (255, 255, 255))
centered.paste(qr_pil, ((size - w) // 2, (size - h) // 2))
qr_buffer = io.BytesIO()
centered.save(qr_buffer, format="PNG")
qr_b64 = base64.b64encode(qr_buffer.getvalue()).decode()

# Read images and base64 encode them
def img_to_b64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()

script_dir = os.path.dirname(os.path.abspath(__file__))
hero_b64 = img_to_b64(os.path.join(script_dir, "hero-banner.png"))
sound_hsa_b64 = img_to_b64(os.path.join(script_dir, "sound-hsa-logo.png"))
unchained_b64 = img_to_b64(os.path.join(script_dir, "unchained-logo.png"))
ten31_b64 = img_to_b64(os.path.join(script_dir, "ten31-logo.png"))

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  @page {{
    size: letter;
    margin: 0;
  }}

  * {{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }}

  body {{
    font-family: 'Optima', 'Candara', 'Palatino', Georgia, serif;
    background: #FFFFFF;
    color: #1A3A6B;
    width: 8.5in;
    height: 11in;
    overflow: hidden;
  }}

  .page {{
    width: 8.5in;
    height: 11in;
    padding: 0.35in 0.55in 0.3in;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: hidden;
  }}

  /* Hero Banner */
  .hero-banner {{
    width: 100%;
    max-width: 5.33in;
    border-radius: 10px;
    margin-bottom: 10px;
  }}

  /* Title Block */
  .title-block {{
    text-align: center;
    margin-bottom: 4px;
  }}

  .eyebrow {{
    font-size: 8pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: #2B80C9;
    margin-bottom: 3px;
  }}

  h1 {{
    font-size: 22pt;
    font-weight: 700;
    color: #031169;
    line-height: 1.1;
    letter-spacing: -0.02em;
    margin-bottom: 4px;
  }}

  h1 .accent {{
    color: #2B80C9;
  }}

  .subtitle {{
    font-size: 10.5pt;
    color: #5B7FA6;
    font-weight: 500;
    margin-bottom: 3px;
  }}

  .location {{
    font-size: 11pt;
    color: #031169;
    font-weight: 700;
    margin-bottom: 2px;
  }}

  .date {{
    font-size: 10pt;
    color: #5B7FA6;
    font-weight: 500;
  }}

  /* Sponsors */
  .sponsors {{
    text-align: center;
    margin: 4px 0;
  }}

  .sponsors-label {{
    font-size: 7pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: #5B7FA6;
    margin-bottom: 4px;
  }}

  .sponsors-logos {{
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 36px;
    flex-direction: row;
    flex-wrap: nowrap;
  }}

  .sponsor-logo {{
    height: 100px;
    width: auto;
    object-fit: contain;
  }}

  .sponsor-logo-unchained {{
    height: 16px;
  }}

  .sponsor-logo-ten31 {{
    height: 56px;
  }}

  /* Divider */
  .divider {{
    width: 60px;
    height: 2.5px;
    background: linear-gradient(90deg, #2B80C9, #4EA1E9);
    margin: 0 auto 6px;
    border-radius: 2px;
  }}

  /* About Section */
  .about {{
    text-align: center;
    max-width: 6.8in;
    margin: 0 auto;
  }}

  .about h2 {{
    font-size: 17pt;
    font-weight: 700;
    color: #031169;
    margin-bottom: 5px;
    letter-spacing: -0.02em;
  }}

  .about h2 .orange {{
    color: #2B80C9;
  }}

  .about p {{
    font-size: 9.5pt;
    color: #1A3A6B;
    line-height: 1.6;
    margin-bottom: 8px;
    text-align: center;
  }}

  /* QR Section */
  .qr-section {{
    text-align: center;
    margin-top: 20px;
    padding-top: 8px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }}

  .qr-section img {{
    width: 1.5in;
    height: 1.5in;
    display: block;
    margin: 0 auto;
  }}

  .qr-label {{
    font-size: 10pt;
    font-weight: 700;
    color: #031169;
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }}

  .qr-sublabel {{
    font-size: 7.5pt;
    color: #5B7FA6;
    margin-top: 2px;
  }}

  /* Footer */
  .footer {{
    text-align: center;
    margin-top: 8px;
    padding-top: 6px;
    border-top: 1px solid rgba(78, 161, 233, 0.2);
    width: 100%;
  }}

  .footer p {{
    font-size: 7.5pt;
    color: #5B7FA6;
  }}
</style>
</head>
<body>
<div class="page">

  <!-- Hero Banner -->
  <img src="data:image/png;base64,{hero_b64}" alt="Park Forum" class="hero-banner">

  <!-- Title -->
  <div class="title-block">
    <p class="eyebrow">Bitcoin Park Presents</p>
    <h1>Park Forum: <span class="accent">The Case for</span><br>Bitcoin in Healthcare</h1>
    <p class="subtitle">Sound Health Through Sound Money</p>
    <p class="location">Nashville, Tennessee</p>
    <p class="date">April 8, 2026 &middot; Bitcoin Park</p>
  </div>

  <!-- Sponsors -->
  <div class="sponsors">
    <p class="sponsors-label">Thank You to Our Sponsors</p>
    <div class="sponsors-logos">
      <img src="data:image/png;base64,{sound_hsa_b64}" alt="Sound HSA" class="sponsor-logo">
      <img src="data:image/png;base64,{unchained_b64}" alt="Unchained" class="sponsor-logo sponsor-logo-unchained">
      <img src="data:image/png;base64,{ten31_b64}" alt="Ten31" class="sponsor-logo sponsor-logo-ten31">
    </div>
  </div>

  <!-- About the Forum -->
  <div class="about">
    <h2>About the <span class="orange">Forum</span></h2>
    <div class="divider"></div>
    <p>The Case for Bitcoin in Healthcare is a curated gathering of physicians, hospital administrators, healthcare entrepreneurs, capital allocators, and policymakers who are shaping the future of health and sound money. United by a shared mission, we are pioneering new models for how healthcare is delivered, financed, and incentivized in the age of Bitcoin and beyond.</p>
    <p>Hosted in the spirit of Bitcoin Park experiences, this gathering centers on the transformative theme of sound health through sound money, and how Bitcoin can address the systemic inefficiencies of fiat-driven healthcare.</p>
  </div>

  <!-- QR Code -->
  <div class="qr-section">
    <img src="data:image/png;base64,{qr_b64}" alt="Register QR Code">
    <p class="qr-label">Register Now</p>
    <p class="qr-sublabel">Scan to secure your seat</p>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>Bitcoin Park &middot; Nashville, TN &middot; bitcoinpark.com</p>
  </div>

</div>
</body>
</html>"""

# Write HTML to temp file, then use Chrome headless to convert to PDF
html_path = os.path.join(script_dir, "_flyer_temp.html")
with open(html_path, "w") as f:
    f.write(html)

output_path = os.path.join(script_dir, "forum-health-flyer.pdf")
chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

result = subprocess.run([
    chrome,
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--print-to-pdf=" + output_path,
    "--print-to-pdf-no-header",
    "--no-margins",
    "file://" + html_path,
], capture_output=True, text=True, timeout=30)

# Clean up temp HTML
os.remove(html_path)

if result.returncode == 0 or os.path.exists(output_path):
    print(f"PDF saved to: {output_path}")
else:
    print(f"Error: {result.stderr}")
    sys.exit(1)
