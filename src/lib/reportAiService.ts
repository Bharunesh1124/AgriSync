import { supabase } from "./supabase";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export async function generateWeeklySummary(reportStats: any): Promise<string> {
  const prompt = `
You are an expert AI agricultural assistant. Review the following farm progress data and provide a concise, natural language weekly summary (max 3 sentences). 
Include emojis. Mention the most significant expense and completion rates. Suggest one focus for next week.

Data:
- Activities Completed: ${reportStats.tasksCompleted} / ${reportStats.tasksTotal} (${reportStats.taskRate}%)
- Total Expenses: ₹${reportStats.expenses}
- Largest Expense: ${reportStats.expenseBreakdown?.[0]?.name || 'None'} (₹${reportStats.expenseBreakdown?.[0]?.val || 0})
- Livestock Health Records Updated: ${reportStats.healthRecords}
- Crop Activities: ${reportStats.cropActivities}
  `;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 }
        })
      }
    );
    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate summary.";
  } catch (error) {
    console.error("AI Summary Error:", error);
    return "Error generating AI summary. Please try again later.";
  }
}

export async function askReportQuestion(question: string, rawData: any, currentStats: any): Promise<string> {
  const prompt = `
You are an intelligent Farm Assistant answering a farmer's question about their progress report.
Keep your answer short, concise, friendly, and data-driven. Do NOT invent numbers.

Farmer Question: "${question}"

Report Context:
- Current Period: Weekly
- Tasks: ${currentStats.tasksCompleted} / ${currentStats.tasksTotal}
- Total Expenses: ₹${currentStats.expenses}
- Expense Categories: ${JSON.stringify(currentStats.expenseBreakdown)}
- Income: ₹${currentStats.income}
- Net: ₹${currentStats.net}
- Active Fields: ${currentStats.cropsActive}
- Total Livestock: ${currentStats.livestockCount}
  `;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4 }
        })
      }
    );
    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to analyze request.";
  } catch (error) {
    console.error("AI Question Error:", error);
    return "Error communicating with AI.";
  }
}
