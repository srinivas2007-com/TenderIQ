from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.models import Company

SAMPLE_COMPANY_FIT_TENDER: Dict[str, Any] = {
    "id": "standard-benchmark",
    "title": "Tender Qualification Benchmark",
    "authority": "Procurement Authority",
    "tender_value": 50000000.0,
    "min_turnover_cr": 5.0,
    "min_experience_years": 5,
    "mandatory_certification": "ISO 9001",
    "min_team_size": 15,
}

SAMPLE_COMPANIES_DATA: List[Dict[str, Any]] = [
    {
        "id": "sample-technova",
        "name": "TechNova Solutions",
        "company_type": "Private Limited Company",
        "industry": "Software Development & IT",
        "annual_turnover": 2.6,
        "average_turnover": 2.6,
        "years_in_business": 1,
        "relevant_experience_years": 1,
        "certifications": ["CMMI Level 3", "MSME Registered"],
        "workforce_count": 12,
        "is_sample": True,
    },
    {
        "id": "sample-apex",
        "name": "Apex Digital Technologies Pvt Ltd",
        "company_type": "Private Limited Company",
        "industry": "Civil & Infrastructure",
        "annual_turnover": 6.5,
        "average_turnover": 6.5,
        "years_in_business": 6,
        "relevant_experience_years": 6,
        "certifications": ["ISO 9001:2015", "MSME Registered"],
        "workforce_count": 20,
        "is_sample": True,
    },
    {
        "id": "sample-innovent",
        "name": "Innovent Systems India Pvt Ltd",
        "company_type": "Private Limited Company",
        "industry": "Enterprise Solutions & Defense",
        "annual_turnover": 82.40,
        "average_turnover": 82.40,
        "years_in_business": 12,
        "relevant_experience_years": 12,
        "certifications": ["ISO 9001:2015", "CMMI Level 5"],
        "workforce_count": 540,
        "is_sample": True,
    },
]

class CompanyFitEngine:
    @staticmethod
    def evaluate_fit(
        company: Any,
        tender_req: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Deterministic, transparent mathematical evaluation of any real company's eligibility
        and fit score (0-100) against any real tender's eligibility requirements.
        """
        if not tender_req:
            tender_req = SAMPLE_COMPANY_FIT_TENDER

        req_turnover = float(tender_req.get("min_turnover_cr", 5.0))
        req_exp_years = int(tender_req.get("min_experience_years", 5))
        req_cert = str(tender_req.get("mandatory_certification", "ISO 9001")).strip()
        req_team_size = int(tender_req.get("min_team_size", 15))

        # Real Company values
        comp_turnover = getattr(company, "annual_turnover", None) or 0.0
        comp_avg_to = getattr(company, "average_turnover", None) or 0.0
        effective_to = max(comp_turnover, comp_avg_to)
        
        comp_exp = getattr(company, "relevant_experience_years", None) or getattr(company, "years_in_business", None) or 0
        comp_certs = getattr(company, "certifications", None) or []
        comp_workforce = getattr(company, "workforce_count", None) or 0

        # Check Certifications
        has_mandatory_cert = any(req_cert.lower() in str(c).lower() for c in comp_certs)
        has_additional_certs = len(comp_certs) >= 3
        
        # 1. Turnover Evaluation (Max 25 pts)
        if req_turnover <= 0:
            to_status = "pass"
            to_msg = "No minimum turnover specified"
            to_score = 25.0
        elif effective_to < req_turnover:
            to_status = "fail"
            to_msg = f"Below ₹{req_turnover:g} Cr"
            to_score = round((effective_to / req_turnover) * 25.0, 1)
        elif effective_to >= req_turnover * 2.5:
            to_status = "exceeds"
            to_msg = "Exceeds requirement"
            to_score = 25.0
        else:
            to_status = "pass"
            to_msg = "Meets requirement"
            to_score = 21.0

        # 2. Experience Evaluation (Max 25 pts)
        if req_exp_years <= 0:
            exp_status = "pass"
            exp_msg = "No minimum experience specified"
            exp_score = 25.0
        elif comp_exp < req_exp_years:
            exp_status = "fail"
            exp_msg = f"Below {req_exp_years} Years"
            exp_score = round((comp_exp / req_exp_years) * 25.0, 1)
        elif comp_exp >= req_exp_years * 2.0:
            exp_status = "exceeds"
            exp_msg = "Exceeds requirement"
            exp_score = 25.0
        else:
            exp_status = "pass"
            exp_msg = "Meets requirement"
            exp_score = 21.0

        # 3. Mandatory Certification Evaluation (Max 25 pts)
        if not req_cert or req_cert.lower() in ["none", "na", "not required"]:
            cert_status = "pass"
            cert_msg = "No specific certification required"
            cert_score = 25.0
        elif not has_mandatory_cert:
            cert_status = "fail"
            cert_msg = "Missing"
            cert_score = min(15.0, len(comp_certs) * 5.0)
        elif has_additional_certs:
            cert_status = "exceeds"
            cert_msg = "Available (+ multiple accreditations)"
            cert_score = 25.0
        else:
            cert_status = "pass"
            cert_msg = "Available"
            cert_score = 21.0

        # 4. Workforce / Team Size Evaluation (Max 25 pts)
        if req_team_size <= 0:
            wf_status = "pass"
            wf_msg = "No minimum team size specified"
            wf_score = 25.0
        elif comp_workforce < req_team_size:
            wf_status = "fail"
            wf_msg = f"Below {req_team_size} Staff"
            wf_score = round((comp_workforce / req_team_size) * 25.0, 1)
        elif comp_workforce >= req_team_size * 3.0:
            wf_status = "exceeds"
            wf_msg = "Exceeds requirement"
            wf_score = 25.0
        else:
            wf_status = "pass"
            wf_msg = "Meets requirement"
            wf_score = 21.0

        # Total Fit Score
        total_raw = to_score + exp_score + cert_score + wf_score
        fit_score = min(100, max(0, int(round(total_raw))))

        # Overall Eligibility: Must pass all 4 mandatory criteria
        is_eligible = (to_status in ["pass", "exceeds"]) and \
                      (exp_status in ["pass", "exceeds"]) and \
                      (cert_status in ["pass", "exceeds"]) and \
                      (wf_status in ["pass", "exceeds"])

        result_label = "Eligible" if is_eligible else "Not Eligible"
        comp_name = getattr(company, "name", "My Company")

        # Summary bullets
        summary_reasons = [
            f"Turnover: {'✅' if to_status != 'fail' else '❌'} {to_msg}",
            f"Experience: {'✅' if exp_status != 'fail' else '❌'} {exp_msg}",
            f"{req_cert or 'Certification'}: {'✅' if cert_status != 'fail' else '❌'} {cert_msg}",
            f"Team Size: {'✅' if wf_status != 'fail' else '❌'} {wf_msg}",
            f"Overall Fit: {fit_score}/100 — {result_label}"
        ]

        criteria = {
            "turnover": {
                "name": "Turnover Requirement",
                "status": to_status,
                "required_value": f"₹{req_turnover:g} Cr" if req_turnover > 0 else "N/A",
                "company_value": f"₹{effective_to:g} Cr",
                "message": to_msg,
                "score": to_score,
                "max_score": 25.0
            },
            "experience": {
                "name": "Domain Experience",
                "status": exp_status,
                "required_value": f"{req_exp_years} Years" if req_exp_years > 0 else "N/A",
                "company_value": f"{comp_exp} Years",
                "message": exp_msg,
                "score": exp_score,
                "max_score": 25.0
            },
            "certification": {
                "name": f"Mandatory {req_cert}" if req_cert else "Accreditation",
                "status": cert_status,
                "required_value": req_cert or "N/A",
                "company_value": "Available" if has_mandatory_cert else ("Missing" if req_cert else "N/A"),
                "message": cert_msg,
                "score": cert_score,
                "max_score": 25.0
            },
            "workforce": {
                "name": "Workforce Capacity",
                "status": wf_status,
                "required_value": f"{req_team_size} Staff" if req_team_size > 0 else "N/A",
                "company_value": f"{comp_workforce} Staff",
                "message": wf_msg,
                "score": wf_score,
                "max_score": 25.0
            }
        }

        return {
            "company_id": getattr(company, "id", "comp-id"),
            "company_name": comp_name,
            "tender_id": tender_req.get("id"),
            "tender_title": tender_req.get("title", "Active Tender"),
            "fit_score": fit_score,
            "is_eligible": is_eligible,
            "result_label": result_label,
            "criteria": criteria,
            "summary_reasons": summary_reasons
        }
