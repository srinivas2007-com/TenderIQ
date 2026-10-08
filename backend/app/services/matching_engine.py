import re
from typing import Dict, Any, List, Tuple
from app.models.models import Company, TenderRequirement, TenderDocumentChecklist

class MatchingEngine:
    @staticmethod
    def evaluate_tender_match(
        company: Company,
        requirements: List[Dict[str, Any]],
        documents: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Executes structured comparison between Company Profile and Tender Requirements.
        Computes transparent Bid Readiness Score (0-100) and explainable recommendation.
        """
        evaluated_requirements = []
        pass_reasons = []
        warning_reasons = []
        fail_reasons = []

        # Scoring Weights
        # Eligibility: 40, Technical: 20, Experience: 15, Financial: 15, Documents: 10
        eligibility_earned = 0.0
        eligibility_max = 40.0

        technical_earned = 0.0
        technical_max = 20.0

        experience_earned = 0.0
        experience_max = 15.0

        financial_earned = 0.0
        financial_max = 15.0

        documents_earned = 0.0
        documents_max = 10.0

        # Company profile values (safe defaults)
        c_annual_to = company.annual_turnover or 0.0
        c_avg_to = company.average_turnover or c_annual_to
        c_years_biz = company.years_in_business or 0
        c_exp_years = company.relevant_experience_years or c_years_biz
        c_completed_projects = company.completed_projects_count or 0
        c_certs = [c.upper() for c in (company.certifications or [])]
        c_workforce = company.workforce_count or 0
        c_services = [s.lower() for s in (company.services or [])]
        c_gst = bool(company.gst_number and company.gst_number.strip())
        c_pan = bool(company.pan_number and company.pan_number.strip())

        # 1. Compare Requirements
        for req in requirements:
            cat = (req.get("category") or "").lower()
            title = req.get("requirement_title") or "General Requirement"
            req_text = req.get("requirement") or ""
            val_str = str(req.get("value") or "")
            mandatory = req.get("mandatory", True)
            source_page = req.get("source_page", 1)

            result = "UNKNOWN"
            comp_status = "Not specified"
            reason = ""

            # CATEGORY: TURNOVER / FINANCIAL
            if "turnover" in cat or "turnover" in title.lower():
                target_val = 5.0
                try:
                    num_match = re.search(r'([0-9]+(?:\.[0-9]+)?)', val_str)
                    if num_match:
                        target_val = float(num_match.group(1))
                except Exception:
                    pass

                comp_status = f"₹{c_avg_to:.2f} Cr (Avg Turnover)"
                if c_avg_to >= target_val:
                    result = "PASS"
                    reason = f"Company turnover (₹{c_avg_to:.2f} Cr) satisfies tender requirement (₹{target_val:.2f} Cr)."
                    financial_earned += financial_max
                    pass_reasons.append(f"Financial turnover requirement satisfied: ₹{c_avg_to:.2f} Cr vs required ₹{target_val:.2f} Cr.")
                elif c_avg_to >= (target_val * 0.75):
                    result = "PARTIAL"
                    reason = f"Company turnover (₹{c_avg_to:.2f} Cr) is marginally below required ₹{target_val:.2f} Cr (75%+ threshold reached; JV or Consortium may be needed)."
                    financial_earned += financial_max * 0.5
                    warning_reasons.append(f"Turnover is slightly below threshold (₹{c_avg_to:.2f} Cr vs required ₹{target_val:.2f} Cr).")
                else:
                    result = "FAIL"
                    reason = f"Company turnover (₹{c_avg_to:.2f} Cr) is below required ₹{target_val:.2f} Cr."
                    financial_earned += 0.0
                    fail_reasons.append(f"Turnover shortfall: ₹{c_avg_to:.2f} Cr vs required ₹{target_val:.2f} Cr.")

            # CATEGORY: EXPERIENCE
            elif "experience" in cat or "experience" in title.lower():
                target_years = 3
                try:
                    num_match = re.search(r'([0-9]+)', val_str)
                    if num_match:
                        target_years = int(num_match.group(1))
                except Exception:
                    pass

                comp_status = f"{c_exp_years} Years relevant experience"
                if c_exp_years >= target_years:
                    result = "PASS"
                    reason = f"Company experience ({c_exp_years} yrs) meets or exceeds tender requirement ({target_years} yrs)."
                    experience_earned += experience_max * 0.6
                    pass_reasons.append(f"Experience requirement satisfied ({c_exp_years} years vs {target_years} required).")
                elif c_exp_years >= (target_years - 1):
                    result = "PARTIAL"
                    reason = f"Company has {c_exp_years} yrs experience, slightly under {target_years} yrs required."
                    experience_earned += experience_max * 0.3
                    warning_reasons.append(f"Operating experience is close to requirement ({c_exp_years} yrs vs {target_years} required).")
                else:
                    result = "FAIL"
                    reason = f"Company has {c_exp_years} yrs experience, below required {target_years} yrs."
                    fail_reasons.append(f"Experience requirement not met ({c_exp_years} yrs vs {target_years} required).")

            # CATEGORY: SIMILAR PROJECTS
            elif "similar" in title.lower() or "project" in title.lower():
                target_projects = 2
                try:
                    num_match = re.search(r'([0-9]+)', val_str)
                    if num_match:
                        target_projects = int(num_match.group(1))
                except Exception:
                    pass

                comp_status = f"{c_completed_projects} Completed Projects"
                if c_completed_projects >= target_projects:
                    result = "PASS"
                    reason = f"Company completed {c_completed_projects} projects, exceeding threshold of {target_projects}."
                    experience_earned += experience_max * 0.4
                    pass_reasons.append(f"Similar completed projects requirement satisfied ({c_completed_projects} completed).")
                elif c_completed_projects >= 1:
                    result = "PARTIAL"
                    reason = f"Company has {c_completed_projects} completed projects (at least {target_projects} preferred)."
                    experience_earned += experience_max * 0.2
                    warning_reasons.append(f"Project credentials need enhancement ({c_completed_projects} projects completed).")
                else:
                    result = "FAIL"
                    reason = "No similar completed projects recorded in company profile."
                    fail_reasons.append("Zero completed similar projects in company profile.")

            # CATEGORY: CERTIFICATION (ISO / MSME)
            elif "certification" in cat or "iso" in title.lower() or "iso" in req_text.lower():
                matched_cert = False
                cert_name = "ISO 9001"
                if "27001" in req_text:
                    cert_name = "ISO 27001"
                elif "14001" in req_text:
                    cert_name = "ISO 14001"

                for c in c_certs:
                    if cert_name.replace(" ", "") in c.replace(" ", ""):
                        matched_cert = True
                        break

                if matched_cert:
                    comp_status = f"Available ({cert_name} Certified)"
                    result = "PASS"
                    reason = f"Valid {cert_name} certification confirmed in company profile."
                    eligibility_earned += eligibility_max * 0.5
                    pass_reasons.append(f"Required quality certification ({cert_name}) is active.")
                else:
                    comp_status = f"Missing ({cert_name} Not Registered)"
                    result = "FAIL" if mandatory else "PARTIAL"
                    reason = f"{cert_name} is not present in company profile certificates."
                    if mandatory:
                        fail_reasons.append(f"Mandatory certification missing: {cert_name}.")
                    else:
                        warning_reasons.append(f"Optional certification missing: {cert_name}.")

            # CATEGORY: TECHNICAL CAPABILITY / WORKFORCE
            elif "technical" in cat or "workforce" in title.lower() or "personnel" in title.lower():
                comp_status = f"{c_workforce} Active technical team members"
                if c_workforce >= 10:
                    result = "PASS"
                    reason = f"Workforce size ({c_workforce} staff) fulfills technical deployment requirement."
                    technical_earned += technical_max
                    pass_reasons.append(f"Technical workforce capacity confirmed ({c_workforce} members).")
                elif c_workforce >= 3:
                    result = "PARTIAL"
                    reason = f"Current workforce ({c_workforce} members) meets minimum baseline but additional resources may be needed."
                    technical_earned += technical_max * 0.6
                    warning_reasons.append(f"Workforce size is modest ({c_workforce} members).")
                else:
                    result = "FAIL"
                    reason = "Workforce profile has insufficient personnel registered."
                    technical_earned += technical_max * 0.2
                    fail_reasons.append("Technical workforce below required threshold.")

            # CATEGORY: LEGAL / STATUTORY REGISTRATION (GST / PAN)
            elif "legal" in cat or "statutory" in cat or "gst" in title.lower() or "pan" in title.lower():
                if c_gst and c_pan:
                    comp_status = f"Valid GSTIN & PAN recorded"
                    result = "PASS"
                    reason = "Both GST registration and PAN credentials are verified."
                    eligibility_earned += eligibility_max * 0.5
                    pass_reasons.append("Legal statutory compliance satisfied (GST & PAN registered).")
                elif c_gst or c_pan:
                    comp_status = "Partial compliance (Missing either GST or PAN)"
                    result = "PARTIAL"
                    reason = "One of GST or PAN is missing in profile."
                    eligibility_earned += eligibility_max * 0.25
                    warning_reasons.append("Partial statutory compliance registered.")
                else:
                    comp_status = "Missing GST / PAN details"
                    result = "FAIL"
                    reason = "GST and PAN numbers missing in company profile."
                    fail_reasons.append("Mandatory statutory registrations (GST & PAN) missing.")

            # DEFAULT / UNKNOWN
            else:
                comp_status = "Document Review Required"
                result = "PARTIAL"
                reason = "Requires bidder self-confirmation."
                eligibility_earned += eligibility_max * 0.2

            evaluated_requirements.append({
                "category": cat,
                "requirement_title": title,
                "tender_requirement": req_text,
                "tender_value": val_str,
                "unit": req.get("unit"),
                "mandatory": mandatory,
                "source_page": source_page,
                "source_text": req.get("source_text"),
                "confidence": req.get("confidence", 0.95),
                "company_status": comp_status,
                "match_result": result,
                "match_reason": reason
            })

        # 2. Evaluate Document Checklist
        # Auto-match with company status and profile docs
        evaluated_documents = []
        ready_count = 0
        mandatory_missing = 0

        for doc in documents:
            doc_name = doc.get("name", "")
            is_mandatory = doc.get("mandatory", True)
            doc_lower = doc_name.lower()
            
            status = "MISSING"
            notes = ""

            # Check if company has this document
            if "gst" in doc_lower and c_gst:
                status = "READY"
                notes = f"Verified with Company GSTIN ({company.gst_number})"
            elif "pan" in doc_lower and c_pan:
                status = "READY"
                notes = f"Verified with Company PAN ({company.pan_number})"
            elif "iso" in doc_lower and any("ISO" in c for c in c_certs):
                status = "READY"
                notes = "Certified under company registrations"
            elif "msme" in doc_lower or "udyam" in doc_lower:
                if any("MSME" in c or "UDYAM" in c for c in c_certs):
                    status = "READY"
                    notes = "MSME/Udyam registered"
                else:
                    status = "MISSING"
                    notes = "Available for EMD exemption if uploaded"
            elif "turnover" in doc_lower or "financial" in doc_lower:
                if c_avg_to > 0:
                    status = "PARTIAL"
                    notes = "Financial numbers registered, CA seal certificate upload needed"
                else:
                    status = "MISSING"
                    notes = "CA Audited certificate required"
            elif "completion" in doc_lower or "experience" in doc_lower:
                if c_completed_projects > 0:
                    status = "PARTIAL"
                    notes = f"{c_completed_projects} projects recorded, client completion certificates required"
                else:
                    status = "MISSING"
                    notes = "Client work completion certificate required"
            else:
                status = "MISSING"
                notes = "Standard tender affidavit/undertaking needed"

            if status == "READY":
                ready_count += 1
            elif status == "PARTIAL":
                ready_count += 0.5
            elif is_mandatory:
                mandatory_missing += 1

            evaluated_documents.append({
                "name": doc_name,
                "category": doc.get("category", "statutory"),
                "mandatory": is_mandatory,
                "source_page": doc.get("source_page", 1),
                "source_text": doc.get("source_text"),
                "confidence": doc.get("confidence", 0.95),
                "status": status,
                "notes": notes
            })

        # Calculate documentation score
        total_docs = max(1, len(documents))
        doc_ratio = min(1.0, ready_count / total_docs)
        documents_earned = round(documents_max * doc_ratio, 1)
        if mandatory_missing > 0:
            fail_reasons.append(f"{mandatory_missing} mandatory document(s) need to be prepared or uploaded.")
        else:
            pass_reasons.append("Core statutory documentation credentials are in order.")

        # Cap individual earned scores to their maximums
        eligibility_earned = min(eligibility_max, round(eligibility_earned, 1))
        technical_earned = min(technical_max, round(technical_earned, 1))
        experience_earned = min(experience_max, round(experience_earned, 1))
        financial_earned = min(financial_max, round(financial_earned, 1))
        documents_earned = min(documents_max, round(documents_earned, 1))

        # Total Bid Readiness Score (0-100)
        total_score = int(round(eligibility_earned + technical_earned + experience_earned + financial_earned + documents_earned))
        total_score = max(0, min(100, total_score))

        # Determine Recommendation based on score & critical disqualifications
        if total_score >= 92 and len(fail_reasons) == 0:
            recommendation = "SUITABLE TO APPLY"
        elif total_score >= 70 and len(fail_reasons) <= 1:
            recommendation = "APPLY WITH CAUTION"
        else:
            recommendation = "NOT RECOMMENDED"

        # Ensure deduplicated clean reason lists
        pass_reasons = list(dict.fromkeys(pass_reasons))
        warning_reasons = list(dict.fromkeys(warning_reasons))
        fail_reasons = list(dict.fromkeys(fail_reasons))

        return {
            "readiness_score": total_score,
            "score_breakdown": {
                "eligibility": {"earned": eligibility_earned, "max": eligibility_max},
                "technical": {"earned": technical_earned, "max": technical_max},
                "experience": {"earned": experience_earned, "max": experience_max},
                "financial": {"earned": financial_earned, "max": financial_max},
                "documents": {"earned": documents_earned, "max": documents_max},
                "total": total_score
            },
            "recommendation": recommendation,
            "reasons": {
                "pass": pass_reasons,
                "warning": warning_reasons,
                "fail": fail_reasons
            },
            "evaluated_requirements": evaluated_requirements,
            "evaluated_documents": evaluated_documents
        }

    @staticmethod
    def calculate_company_completeness(company: Company) -> Tuple[int, List[str]]:
        """
        Calculates company profile completeness percentage and missing items.
        """
        has_services = bool(
            (company.services and len(company.services) > 0)
            or (company.technical_qualifications and company.technical_qualifications.strip())
            or (company.description and company.description.strip())
        )
        has_turnover = bool(
            (company.annual_turnover or 0) > 0
            or (company.average_turnover or 0) > 0
            or (company.turnover_history and len(company.turnover_history) > 0)
        )
        has_experience = bool(
            (company.years_in_business or 0) > 0
            or (company.completed_projects_count or 0) > 0
            or (company.relevant_experience_years or 0) > 0
            or (company.similar_projects_desc and company.similar_projects_desc.strip())
        )

        checklist = [
            ("Basic Company Name & Type", bool(company.name and company.company_type)),
            ("Industry & Business Description", bool(company.industry and company.description)),
            ("Operating Location & State", bool(company.location and company.state)),
            ("Annual Turnover & Financial History", has_turnover),
            ("Operating Experience & Project Track Record", has_experience),
            ("ISO / Quality Certifications", bool(company.certifications and len(company.certifications) > 0)),
            ("Technical Services & Capabilities", has_services),
            ("Workforce Capacity", bool((company.workforce_count or 0) > 0)),
            ("GST Registration Number", bool(company.gst_number and company.gst_number.strip())),
            ("Permanent Account Number (PAN)", bool(company.pan_number and company.pan_number.strip())),
        ]

        completed = sum(1 for _, ok in checklist if ok)
        missing = [item for item, ok in checklist if not ok]
        percentage = int(round((completed / len(checklist)) * 100))
        return percentage, missing
