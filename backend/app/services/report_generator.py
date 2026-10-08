import io
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

class ReportGenerator:
    """
    Professional PDF Tender Intelligence & Bid Decision Report Generator for TenderIQ AI.
    Builds clean, enterprise-grade executive reports.
    """

    @staticmethod
    def generate_tender_pdf(tender_data: Dict[str, Any]) -> io.BytesIO:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        # Custom professional styles
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontSize=20,
            leading=24,
            textColor=colors.HexColor('#0f172a'),
            fontName='Helvetica-Bold'
        )
        subtitle_style = ParagraphStyle(
            'DocSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            leading=13,
            textColor=colors.HexColor('#64748b'),
            fontName='Helvetica'
        )
        h2_style = ParagraphStyle(
            'SectionH2',
            parent=styles['Heading2'],
            fontSize=13,
            leading=17,
            textColor=colors.HexColor('#1e293b'),
            fontName='Helvetica-Bold',
            spaceBefore=10,
            spaceAfter=4
        )
        body_style = ParagraphStyle(
            'BodyTextCustom',
            parent=styles['Normal'],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#334155'),
            fontName='Helvetica'
        )
        badge_style = ParagraphStyle(
            'BadgeText',
            parent=styles['Normal'],
            fontSize=9,
            leading=11,
            textColor=colors.white,
            fontName='Helvetica-Bold'
        )

        # Helper lambdas for null-safe formatting
        def _safe_float(val: Any, default: float = 0.0) -> float:
            if val is None:
                return default
            try:
                return float(val)
            except (ValueError, TypeError):
                return default

        def _safe_str(val: Any, default: str = "N/A") -> str:
            if val is None:
                return default
            s = str(val).strip()
            return s if s else default

        elements = []

        # Header Banner
        elements.append(Paragraph("TenderIQ AI — Tender Intelligence & Bid Decision Report", title_style))
        elements.append(Paragraph("Know Before You Bid  |  Enterprise Procurement Intelligence", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563eb'), spaceBefore=8, spaceAfter=14))

        # Tender Overview Table
        tender = tender_data.get("tender") or {}
        analysis = tender_data.get("analysis") or {}

        opp_score = _safe_float(tender.get("opportunity_score"))
        opp_verdict = _safe_str(tender.get("opportunity_verdict"), "N/A")
        readiness_score = _safe_float(analysis.get("readiness_score"))

        overview_data = [
            [
                Paragraph("<b>Tender Title:</b>", body_style),
                Paragraph(_safe_str(tender.get("title")), body_style),
                Paragraph("<b>Reference NIT:</b>", body_style),
                Paragraph(_safe_str(tender.get("reference_number")), body_style)
            ],
            [
                Paragraph("<b>Procuring Authority:</b>", body_style),
                Paragraph(_safe_str(tender.get("organization")), body_style),
                Paragraph("<b>Estimated Value:</b>", body_style),
                Paragraph(_safe_str(tender.get("estimated_value_display"), "Not Disclosed"), body_style)
            ],
            [
                Paragraph("<b>Location:</b>", body_style),
                Paragraph(_safe_str(tender.get("location")), body_style),
                Paragraph("<b>Duration:</b>", body_style),
                Paragraph(_safe_str(tender.get("contract_duration")), body_style)
            ],
            [
                Paragraph("<b>Bid Readiness:</b>", body_style),
                Paragraph(f"<b>{readiness_score:.0f} / 100</b>", body_style),
                Paragraph("<b>Opportunity Score:</b>", body_style),
                Paragraph(f"<b>{opp_score:.1f} / 100 ({opp_verdict})</b>", body_style)
            ]
        ]

        t_overview = Table(overview_data, colWidths=[110, 160, 110, 160])
        t_overview.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e2e8f0')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        elements.append(t_overview)
        elements.append(Spacer(1, 12))

        # Executive Summary
        raw_summary = analysis.get("executive_summary") or tender.get("executive_summary") or "Tender analyzed by TenderIQ AI."
        exec_summary = _safe_str(raw_summary, "Tender analyzed by TenderIQ AI.")
        elements.append(Paragraph("Executive Summary & Strategic Scope", h2_style))
        elements.append(Paragraph(exec_summary, body_style))
        elements.append(Spacer(1, 10))

        # Commercial & Profit Scenarios Table
        cost = tender_data.get("cost_estimate") or {}
        profit = tender_data.get("profit_scenario") or {}
        if cost or profit:
            labour = _safe_float(cost.get("labour_cost"))
            materials = _safe_float(cost.get("materials_cost"))
            equipment = _safe_float(cost.get("equipment_cost"))
            software = _safe_float(cost.get("software_tech_cost"))
            subcontracting = _safe_float(cost.get("subcontracting_cost"))
            overhead = _safe_float(cost.get("overhead_admin_cost"))
            contingency = _safe_float(cost.get("contingency_cost"))
            total_cost = _safe_float(cost.get("total_estimated_cost"))

            opt_profit = _safe_float(profit.get("optimistic_profit"))
            opt_margin = _safe_float(profit.get("optimistic_margin"))
            exp_profit = _safe_float(profit.get("expected_profit"))
            exp_margin = _safe_float(profit.get("expected_margin"))
            pess_profit = _safe_float(profit.get("pessimistic_profit"))
            pess_margin = _safe_float(profit.get("pessimistic_margin"))
            risk_res = _safe_float(profit.get("risk_reserve"))
            recommendation = _safe_str(analysis.get("recommendation"), "REVIEW")

            elements.append(Paragraph("Cost Drivers & Profitability Projections", h2_style))
            cost_data = [
                [Paragraph("<b>Cost Driver</b>", body_style), Paragraph("<b>Estimated Cost (INR)</b>", body_style), Paragraph("<b>Scenario</b>", body_style), Paragraph("<b>Projected Profit & Margin</b>", body_style)],
                [Paragraph("Labour / Engineering", body_style), Paragraph(f"₹{labour:,.0f}", body_style), Paragraph("Optimistic", body_style), Paragraph(f"₹{opt_profit:,.0f} ({opt_margin:.1f}%)", body_style)],
                [Paragraph("Materials & Equipment", body_style), Paragraph(f"₹{materials + equipment:,.0f}", body_style), Paragraph("<b>Expected (Baseline)</b>", body_style), Paragraph(f"<b>₹{exp_profit:,.0f} ({exp_margin:.1f}%)</b>", body_style)],
                [Paragraph("Subcontracting & Tech", body_style), Paragraph(f"₹{subcontracting + software:,.0f}", body_style), Paragraph("Pessimistic", body_style), Paragraph(f"₹{pess_profit:,.0f} ({pess_margin:.1f}%)", body_style)],
                [Paragraph("Overhead & Contingency", body_style), Paragraph(f"₹{overhead + contingency:,.0f}", body_style), Paragraph("Risk Reserve Buffer", body_style), Paragraph(f"₹{risk_res:,.0f}", body_style)],
                [Paragraph("<b>Total Estimated Execution Cost</b>", body_style), Paragraph(f"<b>₹{total_cost:,.0f}</b>", body_style), Paragraph("<b>Final Recommendation</b>", body_style), Paragraph(f"<b>{recommendation}</b>", body_style)]
            ]
            t_cost = Table(cost_data, colWidths=[140, 130, 130, 140])
            t_cost.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
                ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ]))
            elements.append(t_cost)
            elements.append(Spacer(1, 10))

        # Eligibility Compliance & Source Verification
        reqs = tender_data.get("requirements") or []
        if reqs:
            elements.append(Paragraph("Eligibility Compliance & Source Page Audit", h2_style))
            req_rows = [[Paragraph("<b>Criterion</b>", body_style), Paragraph("<b>Tender Requirement</b>", body_style), Paragraph("<b>Company Status</b>", body_style), Paragraph("<b>Match</b>", body_style), Paragraph("<b>Page</b>", body_style)]]
            for r in reqs[:8]: # Top 8 key criteria
                match = _safe_str(r.get("match_result"), "UNKNOWN")
                match_color = "#16a34a" if match == "PASS" else ("#ea580c" if match == "PARTIAL" else "#dc2626")
                req_rows.append([
                    Paragraph(_safe_str(r.get("requirement_title"), "Criteria"), body_style),
                    Paragraph(_safe_str(r.get("tender_requirement"), "")[:80], body_style),
                    Paragraph(_safe_str(r.get("company_status"), "N/A")[:30], body_style),
                    Paragraph(f"<font color='{match_color}'><b>{match}</b></font>", body_style),
                    Paragraph(_safe_str(r.get("source_page"), "-"), body_style)
                ])
            t_reqs = Table(req_rows, colWidths=[100, 190, 120, 70, 60])
            t_reqs.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
                ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
                ('TOPPADDING', (0,0), (-1,-1), 3),
                ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ]))
            elements.append(t_reqs)
            elements.append(Spacer(1, 10))

        # Contractual Risks & Clarifications
        risks = tender_data.get("risks") or []
        if risks:
            elements.append(Paragraph("Key Contractual Risks & Mitigations", h2_style))
            risk_rows = [[Paragraph("<b>Risk Clause</b>", body_style), Paragraph("<b>Severity</b>", body_style), Paragraph("<b>Identified Hazard</b>", body_style), Paragraph("<b>Mitigation Strategy</b>", body_style)]]
            for rk in risks[:5]:
                sev = _safe_str(rk.get("severity"), "MEDIUM")
                sev_color = "#dc2626" if sev == "HIGH" else ("#d97706" if sev == "MEDIUM" else "#16a34a")
                risk_rows.append([
                    Paragraph(_safe_str(rk.get("title"), "Risk"), body_style),
                    Paragraph(f"<font color='{sev_color}'><b>{sev}</b></font>", body_style),
                    Paragraph(_safe_str(rk.get("description"), "")[:100], body_style),
                    Paragraph(_safe_str(rk.get("mitigation_suggestion"), "N/A")[:100], body_style)
                ])
            t_risks = Table(risk_rows, colWidths=[130, 60, 175, 175])
            t_risks.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
                ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
                ('TOPPADDING', (0,0), (-1,-1), 3),
                ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ]))
            elements.append(t_risks)

        # Footer notes
        elements.append(Spacer(1, 14))
        elements.append(Paragraph(
            "<i>Confidential & Proprietary. Generated automatically by TenderIQ AI Platform. "
            "All values derived from source document verification and deterministic financial algorithms.</i>",
            subtitle_style
        ))

        doc.build(elements)
        buffer.seek(0)
        return buffer
