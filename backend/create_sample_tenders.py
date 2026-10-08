import os
import fitz  # PyMuPDF

SAMPLE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sample_tenders")
os.makedirs(SAMPLE_DIR, exist_ok=True)

def create_cpwd_tender():
    doc = fitz.open()
    
    # Page 1: Notice Inviting Tender
    p1 = doc.new_page()
    p1.insert_text((50, 60), "CENTRAL PUBLIC WORKS DEPARTMENT (CPWD)", fontsize=14, fontname="helv")
    p1.insert_text((50, 80), "GOVERNMENT OF INDIA - CIVIL WORKS DIVISION", fontsize=11, fontname="helv")
    p1.insert_text((50, 110), "NOTICE INVITING e-TENDER (NIT No: CPWD/DZN-II/2026/894)", fontsize=12, fontname="helv")
    
    p1_content = """
1. Name of Work: Construction of Multi-Storey Administrative Office Complex and Allied Infrastructure.
2. Estimated Cost Put to Tender: Rs. 14,50,00,000/- (Rupees Fourteen Crore Fifty Lakhs Only).
3. Earnest Money Deposit (EMD): Rs. 29,00,000/- (Rupees Twenty Nine Lakhs Only).
   (Note: MSME/Udyam registered units are eligible for EMD exemption as per Govt OM).
4. Period of Completion: 18 (Eighteen) Calendar Months.
5. Location of Work: Dwarka Sector 21, New Delhi, India.

CRITICAL DATES & DEADLINES:
- Document Download Start Date: 12-10-2026
- Pre-Bid Meeting Date & Time: 28-10-2026 at 11:00 HRS
- Bid Submission End Date: 10-11-2026 at 15:00 HRS
- Technical Bid Opening Date: 11-11-2026 at 15:30 HRS
- Financial Bid Opening Date: To be notified to technically qualified bidders.
"""
    p1.insert_text((50, 140), p1_content, fontsize=10, fontname="helv")

    # Page 2: Eligibility Criteria
    p2 = doc.new_page()
    p2.insert_text((50, 60), "SECTION II - ELIGIBILITY & QUALIFYING CRITERIA", fontsize=13, fontname="helv")
    p2_content = """
Clause 2.1: Financial Turnover
The bidder should have an Average Annual Financial Turnover of not less than Rs. 10.00 Crore (Rupees Ten Crore) 
during the last three consecutive financial years (FY 2023-24, FY 2022-23, FY 2021-22), duly audited and certified 
by a Chartered Accountant with valid UDIN.

Clause 2.2: Operating Experience
The bidder must have at least 5 (Five) continuous years of operating experience in executing high-rise 
building construction or structural civil works as on the date of submission of bid.

Clause 2.3: Similar Project Experience
The bidder must have successfully completed similar works during the last 7 years ending last day of month 
previous to the one in which applications are invited, meeting either of the following criteria:
a) Three similar completed works each costing not less than Rs. 5.8 Crore, OR
b) Two similar completed works each costing not less than Rs. 7.25 Crore, OR
c) One similar completed work costing not less than Rs. 11.6 Crore.

Clause 2.4: Statutory Registrations
The bidder must have valid GSTIN registration, Permanent Account Number (PAN), and valid Registration Certificate.
"""
    p2.insert_text((50, 90), p2_content, fontsize=10, fontname="helv")

    # Page 3: Technical & Quality Requirements
    p3 = doc.new_page()
    p3.insert_text((50, 60), "SECTION III - TECHNICAL CAPABILITY & CERTIFICATIONS", fontsize=13, fontname="helv")
    p3_content = """
Clause 3.1: Quality Management System (ISO 9001)
The bidder must possess a valid ISO 9001:2015 certification covering building construction and engineering works.
Valid copy of certificate issued by an accredited certification body must be uploaded.

Clause 3.2: Technical Workforce
The contractor must deploy a dedicated project management team including:
- 1 Project Manager (B.Tech Civil with 10+ yrs experience)
- 3 Site Engineers (B.Tech / Diploma with 5+ yrs experience)
- 1 Quality Control Engineer and 1 Safety Officer
- Minimum 20 full-time technical supervisory personnel on active payroll.

Clause 3.3: Machinery & Equipment
The bidder must own or have lease agreement for concrete batching plant, transit mixers, tower crane, 
and bar bending machines.
"""
    p3.insert_text((50, 90), p3_content, fontsize=10, fontname="helv")

    # Page 4: Document Checklist
    p4 = doc.new_page()
    p4.insert_text((50, 60), "SECTION IV - MANDATORY DOCUMENTS CHECKLIST", fontsize=13, fontname="helv")
    p4_content = """
Bidders must upload scanned copies of the following documents in Technical Packet:
1. GST Registration Certificate of appropriate jurisdiction.
2. Permanent Account Number (PAN) Card of the bidding entity.
3. Certificate of Incorporation / Partnership Deed / Firm Registration.
4. Audited Balance Sheets & Profit/Loss accounts with CA Seal & UDIN for last 3 FYs.
5. Turnover Certificate issued by Chartered Accountant.
6. Client Completion Certificates with contract numbers, value, and completion dates.
7. ISO 9001:2015 Quality Certificate.
8. Non-Blacklisting Affidavit on Rs. 100/- non-judicial stamp paper attested by Notary Public.
9. Power of Attorney in favor of authorized signatory.
10. MSME / Udyam Certificate (if claiming EMD exemption).
"""
    p4.insert_text((50, 90), p4_content, fontsize=10, fontname="helv")

    # Page 5: Risks & Penalties
    p5 = doc.new_page()
    p5.insert_text((50, 60), "SECTION V - SPECIAL CONDITIONS, RISKS & PENALTIES", fontsize=13, fontname="helv")
    p5_content = """
Clause 5.1: Liquidated Damages (Penalty for Delay)
If the contractor fails to maintain the required progress in terms of milestones or complete the work 
on or before the stipulated contract completion date, liquidated damages will be recovered at the rate of 
0.5% (half percent) of contract value per week of delay, subject to a maximum ceiling of 10% of awarded contract value.

Clause 5.2: Performance Guarantee (Security Deposit)
The successful contractor shall submit an irrevocable Performance Bank Guarantee (PBG) equivalent to 
5% of the tendered contract value from any Nationalized/Scheduled Commercial Bank within 15 days of 
issue of Letter of Acceptance (LOA).

Clause 5.3: Disqualification & Debarment
Any suppression of facts, submission of forged completion certificates, or failure to perform will result 
in immediate forfeiture of EMD/PBG and debarment/blacklisting across CPWD tenders for 3 years.

Clause 5.4: Price Escalation
No escalation on material, labor, or diesel shall be payable. The rates quoted shall remain firm throughout the contract.
"""
    p5.insert_text((50, 90), p5_content, fontsize=10, fontname="helv")

    out_path = os.path.join(SAMPLE_DIR, "CPWD_Civil_Infrastructure_Tender.pdf")
    doc.save(out_path)
    doc.close()
    print(f"Generated sample tender: {out_path}")

def create_it_tender():
    doc = fitz.open()
    
    # Page 1
    p1 = doc.new_page()
    p1.insert_text((50, 60), "GOVERNMENT e-MARKETPLACE (GeM) / SMART CITY MISSION", fontsize=14, fontname="helv")
    p1.insert_text((50, 80), "REQUEST FOR PROPOSAL (RFP No: SCM/IT-CLOUD/2026/102)", fontsize=12, fontname="helv")
    p1_content = """
1. Name of Work: Implementation and Maintenance of Smart City Cloud Data Platform and IoT Integration.
2. Estimated Tender Value: Rs. 8,20,00,000/- (Rupees Eight Crore Twenty Lakhs Only).
3. Earnest Money Deposit (EMD): Rs. 16,40,000/- (Rupees Sixteen Lakhs Forty Thousand Only).
   MSME bidders exempt upon submission of valid Udyam certificate.
4. Contract Period: 24 Months (2 Years) with 3 Years O&M option.
5. Location: Pune Smart City Development Corporation, Maharashtra, India.

CRITICAL DATES:
- Bid Submission End Date: 15-11-2026 at 17:00 HRS
- Pre-Bid Meeting Date: 02-11-2026 at 14:00 HRS
- Technical Bid Opening Date: 16-11-2026 at 11:00 HRS
"""
    p1.insert_text((50, 110), p1_content, fontsize=10, fontname="helv")

    # Page 2
    p2 = doc.new_page()
    p2.insert_text((50, 60), "ELIGIBILITY AND EVALUATION CRITERIA", fontsize=13, fontname="helv")
    p2_content = """
1. Minimum Average Annual Turnover:
Bidder must have an average annual turnover of at least Rs. 6.00 Crore in the last 3 financial years.

2. Operating Experience:
Bidder must be a registered IT company with at least 4 years in software delivery, cloud integration, or enterprise systems.

3. Certifications:
The bidder must possess valid ISO 9001:2015 and ISO 27001 (Information Security Management) certifications.

4. Technical Capacity:
Bidder must have a minimum of 25 full-time software engineers, DevOps specialists, and security analysts on payroll.

5. Liquidated Damages & Penalties:
Service level agreement (SLA) penalty of 1% per week of delivery delay up to a max limit of 10% contract value.
Performance Security Deposit of 5% in the form of Bank Guarantee.
"""
    p2.insert_text((50, 90), p2_content, fontsize=10, fontname="helv")

    out_path = os.path.join(SAMPLE_DIR, "Smart_City_Cloud_IT_Tender.pdf")
    doc.save(out_path)
    doc.close()
    print(f"Generated sample tender: {out_path}")

if __name__ == "__main__":
    create_cpwd_tender()
    create_it_tender()
