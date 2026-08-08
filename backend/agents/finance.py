"""Finance/Fees Agent: fees, dues, scholarship disbursement, affordability."""

from typing import Any, Dict

from backend.agents.base import BaseAgent, ToolResult
from backend.data import db


class FinanceAgent(BaseAgent):
    name = "finance"
    description = "Fees, dues, scholarship disbursement status, and affordability checks."
    color = "#fbbf24"
    glyph = "FN"

    # -- fee_analysis ---------------------------------------------------------------
    def _fee_analysis(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """Analyze the student's fees, dues, and affordability for a given amount."""
        student = db.get_student(params.get("student_id", state.get("student_id", "S101")))
        query = (params.get("query") or "").lower()
        f = db.FEE_STRUCTURE

        # affordability: extract a rupee amount
        amount = None
        import re
        m = re.search(r"(?:rs\.?\s*|₹\s*|inr\s*)(\d[\d,]*)\s*(?:k|thousand)?", query, re.IGNORECASE)
        if not m:
            m = re.search(r"(\d[\d,]*)\s*(?:k|thousand|rupees|rs)", query, re.IGNORECASE)
        if m and m.group(1):
            try:
                raw = m.group(1).replace(",", "")
                if raw.isdigit():
                    amount = int(raw)
                    if "k" in query[m.start():m.end() + 1].lower() or "thousand" in query.lower():
                        amount *= 1000
            except ValueError:
                amount = None

        due_text = (
            f"- **Tuition (annual)**: ₹{f['tuition_per_year']:,}\n"
            f"- **Lab fee**: ₹{f['lab_fee_per_year']:,} · **Semester exam fee**: ₹{f['exam_fee_sem']:,}\n"
            f"- **Hostel (annual)**: ₹{f['hostel_fee_per_year']:,} · **Transport pass**: ₹{f['transport_pass_monthly']:,}/month"
        )

        if amount is not None:
            budget = student.get("wallet_balance", 0)
            remaining = budget - amount
            verdict = "✅ looks doable" if remaining >= 0 else "❌ you'd be short"
            markdown = (
                f"#### 💰 Can You Afford It?\n"
                f"Estimated cost: **₹{amount:,}** · Current campus wallet balance: **₹{budget:,}**\n\n"
                f"**{verdict}** ({'₹' + f'{remaining:,}' + ' left over' if remaining >= 0 else '₹' + f'{abs(remaining):,}' + ' over budget'}).\n\n"
                f"Tip: split it across an installment, or check the scholarship desk — Women in STEM / Merit "
                f"scholarships can cover up to ₹40,000."
            )
            summary = f"Affordability check for {student['name']}: ₹{amount:,} vs ₹{budget:,} balance."
        elif "disbursement" in query or "scholarship status" in query:
            markdown = (
                f"#### 💰 Scholarship Disbursement\n"
                f"Approved scholarships are disbursed in **two equal installments — October and February** — "
                f"directly to the bank account linked to your student portal.\n\n{due_text}"
            )
            summary = f"Scholarship disbursement schedule for {student['name']}."
        else:
            markdown = (
                f"#### 💰 Fees & Dues Overview\n"
                f"{due_text}\n\n"
                f"Current wallet balance: **₹{student.get('wallet_balance', 0):,}**.\n"
                f"Ask me *\"can I afford a ₹5,000 hackathon trip?\"* for a quick check."
            )
            summary = f"Fee overview for {student['name']}."

        return ToolResult(data={"amount": amount, "wallet_balance": student.get("wallet_balance", 0), "fee_structure": f},
                          summary=summary, markdown=markdown)


FinanceAgent.TOOLS = {
    "fee_analysis": FinanceAgent._fee_analysis,
}

finance_agent = FinanceAgent()
