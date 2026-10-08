import asyncio
import os
import httpx

BASE_URL = "http://127.0.0.1:8000/api"

async def test_full_pipeline():
    async with httpx.AsyncClient(timeout=60.0) as client:
        print("\n--- 1. Testing Registration / Login ---")
        reg_payload = {
            "full_name": "Ramesh Sharma",
            "company_name": "Apex Infra Projects Pvt Ltd",
            "email": "ramesh.sharma@apexinfra.in",
            "phone_number": "+91 9876543210",
            "industry": "Civil Construction & Infrastructure",
            "company_type": "Private Limited Company",
            "password": "SecurePassword123!"
        }
        resp = await client.post(f"{BASE_URL}/auth/register", json=reg_payload)
        if resp.status_code != 200:
            login_resp = await client.post(f"{BASE_URL}/auth/login", json={
                "email": "ramesh.sharma@apexinfra.in",
                "password": "SecurePassword123!"
            })
            token_data = login_resp.json()
        else:
            token_data = resp.json()
            
        token = token_data["access_token"]
        print(f"[OK] Authentication successful. Token obtained.")
        headers = {"Authorization": f"Bearer {token}"}

        print("\n--- 2. Updating Company Digital Twin Profile ---")
        comp_update = {
            "name": "Apex Infra Projects Pvt Ltd",
            "annual_turnover": 8.50,
            "average_turnover": 8.50,
            "turnover_history": [
                {"year": "FY 2023-24", "turnover": 9.20},
                {"year": "FY 2022-23", "turnover": 8.60},
                {"year": "FY 2021-22", "turnover": 7.70}
            ],
            "financial_year": "2023-2024",
            "working_capital": 25000000.0,
            "engineers_count": 8,
            "team_capacity_hours_weekly": 180.0,
            "years_in_business": 7,
            "relevant_experience_years": 7,
            "completed_projects_count": 4,
            "similar_projects_desc": "Executed PWD Admin Tower Phase 1 (Rs 9.5 Cr) and State Highway Bypass Overbridge (Rs 11.2 Cr).",
            "certifications": ["ISO 9001:2015", "MSME / Udyam Registered"],
            "workforce_count": 25,
            "technical_qualifications": "15 B.Tech Civil Engineers, 2 PMP Project Directors",
            "gst_number": "27AAACA1234A1Z5",
            "pan_number": "AAACA1234A",
            "registration_number": "U45200MH2019PTC324150",
            "location": "New Delhi",
            "state": "Delhi"
        }
        comp_resp = await client.put(f"{BASE_URL}/company/profile", json=comp_update, headers=headers)
        assert comp_resp.status_code == 200, f"Company update failed: {comp_resp.text}"
        print("[OK] Company Digital Twin profile successfully updated.")

        print("\n--- 3. Verifying Competitiveness Score & Reverse Gap Analysis ---")
        comp_score_resp = await client.get(f"{BASE_URL}/company/competitiveness", headers=headers)
        assert comp_score_resp.status_code == 200
        cs_data = comp_score_resp.json()
        print(f"[OK] Competitiveness Score: {cs_data['competitiveness_score']}/100. Strengths: {len(cs_data['strengths'])}")

        gaps_resp = await client.get(f"{BASE_URL}/company/gaps", headers=headers)
        assert gaps_resp.status_code == 200
        print(f"[OK] Reverse Gap Analysis returned: {gaps_resp.json().get('total_active_gaps', 0)} active gap areas.")

        print("\n--- 4. Testing Background Tender Upload & Processing ---")
        sample_pdf_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "sample_tenders",
            "CPWD_Civil_Infrastructure_Tender.pdf"
        )
        assert os.path.exists(sample_pdf_path), f"File not found: {sample_pdf_path}"

        with open(sample_pdf_path, "rb") as f:
            files = {"file": ("CPWD_Civil_Infrastructure_Tender.pdf", f, "application/pdf")}
            upload_resp = await client.post(f"{BASE_URL}/tenders/upload", files=files, headers=headers)
        
        assert upload_resp.status_code == 200, f"Tender upload failed: {upload_resp.text}"
        upload_data = upload_resp.json()
        tender_id = upload_data["id"]
        print(f"[OK] Tender Uploaded asynchronously! ID: {tender_id}. Status: {upload_data['status']}")

        # Poll until completed
        print("  Polling background intelligence pipeline...")
        status = upload_data["status"]
        for _ in range(15):
            t_check = await client.get(f"{BASE_URL}/tenders/{tender_id}", headers=headers)
            t_json = t_check.json()
            status = t_json["status"]
            print(f"    Current state: {status.upper()} (Step {t_json['status_step']}/5)")
            if status in ["completed", "failed"]:
                break
            await asyncio.sleep(2)

        assert status == "completed", f"Tender did not complete successfully: {status}"
        print(f"[OK] Background pipeline finished with status: COMPLETED!")

        print("\n--- 5. Verifying Cost Drivers & Multi-Scenario Profit Engine ---")
        cost_resp = await client.get(f"{BASE_URL}/tenders/{tender_id}/cost", headers=headers)
        assert cost_resp.status_code == 200
        cost_data = cost_resp.json()
        print(f"[OK] Total Estimated Cost: Rs. {cost_data['total_estimated_cost']:,.0f}")
        print(f"  Labour: Rs. {cost_data['labour_cost']:,.0f}, Materials: Rs. {cost_data['materials_cost']:,.0f}")

        profit_resp = await client.get(f"{BASE_URL}/tenders/{tender_id}/profit", headers=headers)
        assert profit_resp.status_code == 200
        profit_data = profit_resp.json()
        print(f"[OK] Expected Profit: Rs. {profit_data['expected_profit']:,.0f} ({profit_data['expected_margin']}%)")
        print(f"  Optimistic: Rs. {profit_data['optimistic_profit']:,.0f} ({profit_data['optimistic_margin']}%)")
        print(f"  Pessimistic: Rs. {profit_data['pessimistic_profit']:,.0f} ({profit_data['pessimistic_margin']}%)")

        print("\n--- 6. Verifying Resource Capacity & Engineering Gap Analysis ---")
        res_resp = await client.get(f"{BASE_URL}/tenders/{tender_id}/resources", headers=headers)
        assert res_resp.status_code == 200
        res_data = res_resp.json()
        print(f"[OK] Required Engineers: {res_data['required_engineers']}, Available: {res_data['available_engineers']}, Gap: {res_data['gap_engineers']}")
        print(f"  Action: {res_data['action_recommended']}")

        print("\n--- 7. Verifying What-If Simulator ---")
        sim_resp = await client.post(f"{BASE_URL}/simulation", json={
            "tender_id": tender_id,
            "engineers_count": 12,
            "turnover": 12.0
        }, headers=headers)
        assert sim_resp.status_code == 200
        sim_data = sim_resp.json()
        print(f"[OK] What-If Simulation evaluated:")
        print(f"  Current Opp: {sim_data['current']['opportunity_score']} -> Simulated Opp: {sim_data['scenario']['opportunity_score']}")
        print(f"  Highest-Impact Improvement: {sim_data['highest_impact_improvement']}")

        print("\n--- 8. Verifying Smart Tender Comparison & Best Tender Finder ---")
        best_resp = await client.get(f"{BASE_URL}/tenders/best", headers=headers)
        assert best_resp.status_code == 200
        best_data = best_resp.json()
        print(f"[OK] Best Tender Finder evaluated {len(best_data)} active tenders:")
        if best_data:
            print(f"  #1 Rank: {best_data[0]['title'][:40]}... (Opp: {best_data[0]['opportunity_score']})")

        # Compare if we have at least 2 tenders
        tenders_resp = await client.get(f"{BASE_URL}/tenders", headers=headers)
        all_tenders = tenders_resp.json()
        if len(all_tenders) >= 2:
            compare_resp = await client.post(f"{BASE_URL}/tenders/compare", json={
                "tender_ids": [all_tenders[0]["id"], all_tenders[1]["id"]]
            }, headers=headers)
            assert compare_resp.status_code == 200
            print(f"[OK] Multi-Tender Comparison matrix generated successfully for {len(all_tenders)} tenders.")

        print("\n--- 9. Verifying Portfolio Optimizer ---")
        portfolio_resp = await client.get(f"{BASE_URL}/portfolio", headers=headers)
        assert portfolio_resp.status_code == 200
        p_data = portfolio_resp.json()
        print(f"[OK] Portfolio Combined Value: Rs. {p_data['combined_tender_value']:,.0f}, Expected Profit: Rs. {p_data['combined_expected_profit']:,.0f}")

        opt_resp = await client.post(f"{BASE_URL}/portfolio/optimize", json={
            "available_capital": 30000000.0,
            "available_engineers": 10,
            "available_prep_hours": 160.0
        }, headers=headers)
        assert opt_resp.status_code == 200
        print(f"[OK] Portfolio Optimization selected {opt_resp.json().get('portfolio_count')} optimal target tenders.")

        print("\n--- 10. Verifying Bid Workspace & Automatic Task Generation ---")
        tasks_resp = await client.get(f"{BASE_URL}/tasks?tender_id={tender_id}", headers=headers)
        assert tasks_resp.status_code == 200
        tasks = tasks_resp.json()
        print(f"[OK] Auto-generated {len(tasks)} actionable bid tasks for this tender:")
        for tsk in tasks[:3]:
            print(f"  - [{tsk['status']}] {tsk['title']} (Role: {tsk['assignee_role']}, Priority: {tsk['priority']})")

        print("\n--- 11. Verifying Professional PDF Report Export ---")
        pdf_resp = await client.get(f"{BASE_URL}/tenders/{tender_id}/export-pdf", headers=headers)
        assert pdf_resp.status_code == 200
        assert pdf_resp.headers.get("content-type") == "application/pdf"
        assert len(pdf_resp.content) > 1000
        print(f"[OK] ReportLab Tender Intelligence PDF successfully generated ({len(pdf_resp.content):,} bytes).")

        print("\n--- 12. Verifying Historical Analytics & Learning ---")
        analytics_resp = await client.get(f"{BASE_URL}/analytics", headers=headers)
        assert analytics_resp.status_code == 200
        an_data = analytics_resp.json()
        print(f"[OK] Historical Analytics status: {an_data['history_status_label']}")
        print(f"  Win rate: {an_data['win_rate_percentage']}%, Avg Margin: {an_data['average_margin_percentage']}%")

        print("\n=======================================================")
        print("ALL 12 PRODUCTION TENDERIQ AI WORKFLOWS VERIFIED 100%!")
        print("=======================================================")

if __name__ == "__main__":
    asyncio.run(test_full_pipeline())
