from typing import Dict, Any, List, Optional

class ResourceEngine:
    """
    TenderIQ Resource Capacity and Conflict Engine.
    Estimates execution personnel, detects capacity deficits, and monitors multi-tender resource conflicts.
    """

    @staticmethod
    def calculate_resource_requirements(
        tender_value: Optional[float],
        industry: Optional[str] = "IT",
        company_engineers_available: int = 5,
        company_workforce_total: int = 20
    ) -> Dict[str, Any]:
        val = tender_value or 10000000.0  # ₹1 Cr fallback for scaling
        ind = (industry or "").lower()

        # Scale required team size based on contract value (Crores)
        val_in_cr = max(0.5, val / 10000000.0)

        if "civil" in ind or "construction" in ind:
            req_engineers = max(2, int(round(val_in_cr * 0.8)))
            req_technicians = max(4, int(round(val_in_cr * 2.5)))
            req_pm = max(1, int(round(val_in_cr * 0.2)))
            prep_hours = 60.0 + min(120.0, val_in_cr * 6.0)
        elif "elec" in ind or "power" in ind:
            req_engineers = max(2, int(round(val_in_cr * 0.9)))
            req_technicians = max(3, int(round(val_in_cr * 2.0)))
            req_pm = max(1, int(round(val_in_cr * 0.2)))
            prep_hours = 55.0 + min(100.0, val_in_cr * 5.5)
        else:
            # IT / Software
            req_engineers = max(3, int(round(val_in_cr * 1.2)))
            req_technicians = max(1, int(round(val_in_cr * 0.5)))
            req_pm = max(1, int(round(val_in_cr * 0.25)))
            prep_hours = 75.0 + min(150.0, val_in_cr * 7.0)

        # Gap analysis
        available_eng = max(0, company_engineers_available)
        gap_eng = max(0, req_engineers - available_eng)

        if gap_eng == 0:
            action = "SUFFICIENT_INTERNAL_CAPACITY"
            notes = "Internal engineering team meets the estimated execution requirements."
        elif gap_eng <= 2:
            action = "REALLOCATE_OR_SUBCONTRACT"
            notes = f"Minor gap of {gap_eng} engineers. Recommend internal project reallocation or niche sub-contracting."
        else:
            action = "SUBCONTRACT_OR_HIRE"
            notes = f"Significant gap of {gap_eng} engineers. Recommend consortium partnership, subcontracting, or contingency hiring."

        return {
            "required_engineers": req_engineers,
            "available_engineers": available_eng,
            "gap_engineers": gap_eng,
            "required_pm": req_pm,
            "required_technicians": req_technicians,
            "preparation_hours_needed": round(prep_hours, 1),
            "action_recommended": action,
            "notes": notes,
            "options": [
                {"title": "Internal Reallocation", "feasible": gap_eng <= 3, "description": "Shift team from non-critical maintenance streams"},
                {"title": "Subcontract Specialized Modules", "feasible": True, "description": "Engage vetted technical subcontractors"},
                {"title": "Consortium / Joint Venture", "feasible": gap_eng >= 4, "description": "Partner with a qualified regional contractor"},
                {"title": "Project-Based Lateral Hiring", "feasible": True, "description": "Onboard contract engineers upon LOA issuance"}
            ]
        }

    @staticmethod
    def detect_multi_tender_conflicts(
        active_tenders: List[Dict[str, Any]],
        company_engineers_available: int = 5,
        company_weekly_capacity_hours: float = 160.0
    ) -> Dict[str, Any]:
        """
        Cross-checks all active/bidding tenders for resource collisions and deadline congestion.
        """
        total_engineers_demanded = 0
        total_prep_hours_demanded = 0.0
        tender_breakdown = []

        for t in active_tenders:
            req_eng = t.get("required_engineers", 2)
            prep_hrs = t.get("preparation_hours", 40.0)
            total_engineers_demanded += req_eng
            total_prep_hours_demanded += prep_hrs
            tender_breakdown.append({
                "tender_id": t.get("id"),
                "title": t.get("title", "Untitled"),
                "required_engineers": req_eng,
                "preparation_hours": prep_hrs,
                "deadline": t.get("deadline_display", "Upcoming")
            })

        eng_deficit = max(0, total_engineers_demanded - company_engineers_available)
        hrs_deficit = max(0.0, total_prep_hours_demanded - company_weekly_capacity_hours)

        has_conflict = eng_deficit > 0 or hrs_deficit > 0
        severity = "HIGH" if eng_deficit >= 4 or hrs_deficit >= 80 else ("MEDIUM" if has_conflict else "NONE")

        return {
            "has_conflict": has_conflict,
            "severity": severity,
            "total_engineers_demanded": total_engineers_demanded,
            "company_engineers_available": company_engineers_available,
            "engineer_deficit": eng_deficit,
            "total_prep_hours_demanded": round(total_prep_hours_demanded, 1),
            "available_weekly_capacity_hours": round(company_weekly_capacity_hours, 1),
            "hours_deficit": round(hrs_deficit, 1),
            "affected_tenders_count": len(tender_breakdown),
            "tenders": tender_breakdown,
            "recommendation": (
                f"Resource conflict detected: {eng_deficit} engineer deficit across {len(tender_breakdown)} concurrent bids. "
                f"Prioritize higher opportunity tenders in Portfolio view."
            ) if has_conflict else "No active resource conflicts. Team capacity is optimal."
        }
