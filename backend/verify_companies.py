import asyncio
import httpx

BASE_URL = "http://127.0.0.1:8000/api"

async def test_company_feature():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("\n--- 1. Testing Sample Benchmark Tender Endpoint ---")
        st_resp = await client.get(f"{BASE_URL}/companies/sample-tender")
        assert st_resp.status_code == 200, f"Sample tender endpoint failed: {st_resp.text}"
        st_data = st_resp.json()
        print(f"[OK] Benchmark Tender: '{st_data['title']}' ({st_data['authority']})")
        print(f"  Requirements: Min Turnover Rs.{st_data['min_turnover_cr']} Cr | Min Exp: {st_data['min_experience_years']} Yrs | Cert: {st_data['mandatory_certification']} | Team Size: {st_data['min_team_size']}")

        print("\n--- 2. Testing Company Listing & Fit Evaluations ---")
        comps_resp = await client.get(f"{BASE_URL}/companies")
        assert comps_resp.status_code == 200, f"Companies list failed: {comps_resp.text}"
        comps = comps_resp.json()
        assert len(comps) >= 3, f"Expected at least 3 companies, got {len(comps)}"
        print(f"[OK] Total Companies in Directory: {len(comps)}")

        # Find the 3 demo companies
        technova = next((c for c in comps if "TechNova" in c["name"]), None)
        apex = next((c for c in comps if "Apex Digital" in c["name"]), None)
        innovent = next((c for c in comps if "Innovent" in c["name"]), None)

        assert technova is not None, "TechNova Solutions not found in company list"
        assert apex is not None, "Apex Digital Technologies not found in company list"
        assert innovent is not None, "Innovent Systems not found in company list"

        print(f"\n[OK] Found 3 Sample Companies:")
        print(f"  1. {technova['name']} (Turnover: Rs.{technova['annual_turnover']} Cr, Fit: {technova['fit_score']}/100, Result: {technova['result_label']})")
        print(f"  2. {apex['name']} (Turnover: Rs.{apex['annual_turnover']} Cr, Fit: {apex['fit_score']}/100, Result: {apex['result_label']})")
        print(f"  3. {innovent['name']} (Turnover: Rs.{innovent['annual_turnover']} Cr, Fit: {innovent['fit_score']}/100, Result: {innovent['result_label']})")

        print("\n--- 3. Verifying Detailed Fit Evaluation & Criteria Breakdown ---")
        
        # Test TechNova Fit Breakdown
        tn_fit_resp = await client.get(f"{BASE_URL}/companies/{technova['id']}/fit")
        assert tn_fit_resp.status_code == 200
        tn_fit = tn_fit_resp.json()
        assert tn_fit["fit_score"] == 48, f"Expected TechNova score 48, got {tn_fit['fit_score']}"
        assert tn_fit["is_eligible"] is False
        assert tn_fit["criteria"]["turnover"]["status"] == "fail"
        assert tn_fit["criteria"]["experience"]["status"] == "fail"
        assert tn_fit["criteria"]["certification"]["status"] == "fail"
        assert tn_fit["criteria"]["workforce"]["status"] == "fail"
        print(f"[OK] TechNova Solutions: Fit Score {tn_fit['fit_score']}/100 [Not Eligible]")
        for reason in tn_fit["summary_reasons"]:
            clean_reason = reason.replace("✅", "[PASS]").replace("❌", "[FAIL]").replace("₹", "Rs. ")
            print(f"    - {clean_reason}")

        # Test Apex Digital Fit Breakdown
        apex_fit_resp = await client.get(f"{BASE_URL}/companies/{apex['id']}/fit")
        assert apex_fit_resp.status_code == 200
        apex_fit = apex_fit_resp.json()
        assert apex_fit["fit_score"] == 84, f"Expected Apex score 84, got {apex_fit['fit_score']}"
        assert apex_fit["is_eligible"] is True
        assert apex_fit["criteria"]["turnover"]["status"] in ["pass", "exceeds"]
        assert apex_fit["criteria"]["experience"]["status"] in ["pass", "exceeds"]
        assert apex_fit["criteria"]["certification"]["status"] in ["pass", "exceeds"]
        assert apex_fit["criteria"]["workforce"]["status"] in ["pass", "exceeds"]
        print(f"\n[OK] Apex Digital Technologies: Fit Score {apex_fit['fit_score']}/100 [Eligible]")
        for reason in apex_fit["summary_reasons"]:
            clean_reason = reason.replace("✅", "[PASS]").replace("❌", "[FAIL]").replace("₹", "Rs. ")
            print(f"    - {clean_reason}")

        # Test Innovent Systems Fit Breakdown
        inn_fit_resp = await client.get(f"{BASE_URL}/companies/{innovent['id']}/fit")
        assert inn_fit_resp.status_code == 200
        inn_fit = inn_fit_resp.json()
        assert inn_fit["fit_score"] == 96, f"Expected Innovent score 96, got {inn_fit['fit_score']}"
        assert inn_fit["is_eligible"] is True
        assert inn_fit["criteria"]["turnover"]["status"] == "exceeds"
        assert inn_fit["criteria"]["experience"]["status"] == "exceeds"
        assert inn_fit["criteria"]["certification"]["status"] in ["pass", "exceeds"]
        assert inn_fit["criteria"]["workforce"]["status"] == "exceeds"
        print(f"\n[OK] Innovent Systems India: Fit Score {inn_fit['fit_score']}/100 [Eligible]")
        for reason in inn_fit["summary_reasons"]:
            clean_reason = reason.replace("✅", "[PASS]").replace("❌", "[FAIL]").replace("₹", "Rs. ")
            print(f"    - {clean_reason}")

        print("\n--- 4. Verifying Detailed Company Profiles ---")
        inn_details = (await client.get(f"{BASE_URL}/companies/{innovent['id']}")).json()
        assert inn_details["workforce_count"] == 540
        assert inn_details["annual_turnover"] == 82.40
        assert len(inn_details["turnover_history"]) == 3
        assert len(inn_details["major_projects"]) >= 4
        assert "33AABCI7890L1Z8" in inn_details["gst_number"]
        print(f"[OK] Full Company Profile Verified for '{inn_details['name']}':")
        print(f"  - Turnover: Rs.{inn_details['annual_turnover']} Cr (3-Yr Avg: Rs.{inn_details['average_turnover']} Cr)")
        print(f"  - Workforce: {inn_details['workforce_count']} Staff")
        print(f"  - Experience: {inn_details['years_in_business']} Years, {inn_details['completed_projects_count']} Completed Works")
        print(f"  - Major Projects: {len(inn_details['major_projects'])} items")
        print(f"  - Certifications: {len(inn_details['certifications'])} accreditations")
        print(f"  - GSTIN: {inn_details['gst_number']} | PAN: {inn_details['pan_number']}")

        print("\n=======================================================")
        print("ALL COMPANY MANAGEMENT & FIT EVALUATION TESTS PASSED 100%!")
        print("=======================================================")

if __name__ == "__main__":
    asyncio.run(test_company_feature())
