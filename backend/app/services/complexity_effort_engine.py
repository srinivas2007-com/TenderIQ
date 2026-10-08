from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

class ComplexityEffortEngine:
    """
    Tender Complexity, Bid Effort, and Internal Milestone Scheduling Engine.
    Computes deterministic operational scores for TenderIQ AI.
    """

    @staticmethod
    def calculate_complexity(
        page_count: int,
        requirements_count: int,
        risks_count: int,
        documents_count: int,
        estimated_value: Optional[float] = None
    ) -> float:
        # Base weights:
        # Page count: up to 25 pts (100 pages = 25 pts)
        page_pts = min(25.0, (page_count / 100.0) * 25.0)
        # Requirements count: up to 30 pts (15 reqs = 30 pts)
        req_pts = min(30.0, (requirements_count / 15.0) * 30.0)
        # Risks count: up to 20 pts (5 risks = 20 pts)
        risk_pts = min(20.0, (risks_count / 5.0) * 20.0)
        # Documents count: up to 15 pts (10 docs = 15 pts)
        doc_pts = min(15.0, (documents_count / 10.0) * 15.0)
        # Value scale: up to 10 pts
        val_pts = 5.0
        if estimated_value:
            if estimated_value > 50000000: # > 5 Cr
                val_pts = 10.0
            elif estimated_value > 10000000:
                val_pts = 8.0

        complexity = round(page_pts + req_pts + risk_pts + doc_pts + val_pts, 1)
        return min(100.0, max(15.0, complexity))

    @staticmethod
    def estimate_bid_effort(complexity_score: float) -> Dict[str, Any]:
        """
        Estimates hours needed for technical proposal, financials, docs, compliance, and management approval.
        """
        base_multiplier = complexity_score / 50.0  # ~1.0 for 50 complexity

        doc_hours = round(16.0 * base_multiplier, 1)
        tech_hours = round(28.0 * base_multiplier, 1)
        fin_hours = round(12.0 * base_multiplier, 1)
        compliance_hours = round(10.0 * base_multiplier, 1)
        mgmt_hours = round(6.0 * base_multiplier, 1)

        total_hours = round(doc_hours + tech_hours + fin_hours + compliance_hours + mgmt_hours, 1)

        return {
            "total_effort_hours": total_hours,
            "breakdown": {
                "documentation_hours": doc_hours,
                "technical_proposal_hours": tech_hours,
                "financial_proposal_hours": fin_hours,
                "compliance_review_hours": compliance_hours,
                "management_review_hours": mgmt_hours
            }
        }

    @staticmethod
    def generate_internal_milestones(
        official_submission_date_str: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Generates structured internal milestone dates ahead of the tender deadline.
        Technical proposal: -6 days
        Financial proposal: -4 days
        Document verification: -2 days
        Management signoff: -1 day
        """
        # Parse date if possible or project 14 days ahead
        target_date = datetime.utcnow() + timedelta(days=14)
        if official_submission_date_str:
            for fmt in ["%d-%m-%Y", "%d/%m/%Y", "%Y-%m-%d"]:
                try:
                    # Clean out time parts
                    date_part = official_submission_date_str.split()[0]
                    target_date = datetime.strptime(date_part, fmt)
                    break
                except Exception:
                    pass

        milestones = [
            {
                "title": "Technical Proposal & Solution Architecture",
                "milestone_type": "INTERNAL_TECH",
                "days_before": 6,
                "target_date": (target_date - timedelta(days=6)).strftime("%d-%m-%Y"),
                "description": "Finalize bill of materials, solution compliance sheets, and methodology narrative."
            },
            {
                "title": "Financial Model & Margin Review",
                "milestone_type": "INTERNAL_FIN",
                "days_before": 4,
                "target_date": (target_date - timedelta(days=4)).strftime("%d-%m-%Y"),
                "description": "Lock BoQ pricing, vendor quotations, financing costs, and contingency margins."
            },
            {
                "title": "Statutory Document Auditing & EMD / PBG",
                "milestone_type": "INTERNAL_DOCS",
                "days_before": 2,
                "target_date": (target_date - timedelta(days=2)).strftime("%d-%m-%Y"),
                "description": "Verify GST, audited sheets, EMD bank receipt/exemption, and stamp paper declarations."
            },
            {
                "title": "Executive Committee Signoff & Final Bid Freeze",
                "milestone_type": "INTERNAL_MGMT",
                "days_before": 1,
                "target_date": (target_date - timedelta(days=1)).strftime("%d-%m-%Y"),
                "description": "Executive review of commercial risk, final signature, and digital key authorization."
            }
        ]

        return milestones
