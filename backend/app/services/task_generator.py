from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

class TaskGenerator:
    """
    Automatic Bid Task Generator for TenderIQ AI.
    Converts tender requirements, missing documents, and risk mitigations into operational tasks.
    """

    @staticmethod
    def generate_tasks_for_tender(
        tender_id: str,
        company_id: Optional[str],
        evaluated_requirements: List[Dict[str, Any]],
        evaluated_documents: List[Dict[str, Any]],
        risks: List[Dict[str, Any]],
        deadline_date_str: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        tasks = []

        # 1. Missing or Partial Document Tasks
        for doc in evaluated_documents:
            doc_status = doc.get("status", "MISSING")
            doc_name = doc.get("name", "Document")
            if doc_status in ["MISSING", "PARTIAL"]:
                tasks.append({
                    "tender_id": tender_id,
                    "company_id": company_id,
                    "title": f"Upload and verify {doc_name}",
                    "description": f"Mandatory submission requirement identified on source page {doc.get('source_page', 1)}. Verify validity and CA seal if applicable.",
                    "category": "Documentation",
                    "assignee_role": "Documentation",
                    "priority": "HIGH" if doc.get("mandatory", True) else "MEDIUM",
                    "status": "TODO",
                    "due_date": datetime.utcnow() + timedelta(days=3),
                    "is_ai_generated": True
                })

        # 2. Eligibility & Technical Proposal Tasks
        tasks.append({
            "tender_id": tender_id,
            "company_id": company_id,
            "title": "Prepare Technical Proposal & Methodology Document",
            "description": "Draft complete solution architecture, project execution schedule, and resource deployment matrix.",
            "category": "Technical",
            "assignee_role": "Technical",
            "priority": "HIGH",
            "status": "TODO",
            "due_date": datetime.utcnow() + timedelta(days=6),
            "is_ai_generated": True
        })

        tasks.append({
            "tender_id": tender_id,
            "company_id": company_id,
            "title": "Compile BoQ & Financial Pricing Schedule",
            "description": "Complete itemized price schedule adhering strictly to prescribed tender financial template without conditional qualifications.",
            "category": "Financial",
            "assignee_role": "Finance",
            "priority": "HIGH",
            "status": "TODO",
            "due_date": datetime.utcnow() + timedelta(days=5),
            "is_ai_generated": True
        })

        # 3. High Risk Mitigations
        for rk in risks:
            if rk.get("severity") == "HIGH":
                tasks.append({
                    "tender_id": tender_id,
                    "company_id": company_id,
                    "title": f"Review {rk.get('title')}",
                    "description": rk.get("mitigation_suggestion") or rk.get("description", "Review contractual liability clause"),
                    "category": "Review",
                    "assignee_role": "Bid Manager",
                    "priority": "HIGH",
                    "status": "TODO",
                    "due_date": datetime.utcnow() + timedelta(days=4),
                    "is_ai_generated": True
                })

        # 4. Executive Sign-off and Final Submission
        tasks.append({
            "tender_id": tender_id,
            "company_id": company_id,
            "title": "Executive Committee Tender Signoff",
            "description": "Review final margins, contingency buffers, and obtain authorized signatory digital approval.",
            "category": "Submission",
            "assignee_role": "Management",
            "priority": "HIGH",
            "status": "TODO",
            "due_date": datetime.utcnow() + timedelta(days=8),
            "is_ai_generated": True
        })

        tasks.append({
            "tender_id": tender_id,
            "company_id": company_id,
            "title": "Final Bid Envelope Upload & E-Token Signing",
            "description": "Upload Technical & Financial envelopes to the designated e-procurement portal before submission cut-off time.",
            "category": "Submission",
            "assignee_role": "Bid Manager",
            "priority": "HIGH",
            "status": "TODO",
            "due_date": datetime.utcnow() + timedelta(days=9),
            "is_ai_generated": True
        })

        return tasks
