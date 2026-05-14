# KP-3P Care Sheet: What Happens on Click

When a user clicks **"Download KP-3P Care Sheet"**, this is what happens:

1. The button switches to a loading state (`Generating...`).
2. The app collects the selected patient's assessment data and formats it for KP-3P generation.
3. It sends that data to the backend API endpoint: `/api/generate-caresheet`.
4. The backend builds a KP-3P prompt and sends it to Anthropic Claude (`claude-sonnet-4-20250514`) using `ANTHROPIC_API_KEY` (same system prompt and PDF + patient text as before).
5. Claude returns generated care-sheet HTML content.
6. The frontend opens a full-screen **Preview Caresheet** modal.
7. The generated document is shown in **editable mode** (user can click and edit text).
8. User clicks **Confirm & Download PDF**.
9. The app captures the preview content as an image (`html2canvas`) and converts it into a PDF (`jsPDF`).
10. The PDF is downloaded locally with a name like: `KP3P_<patient-name>.pdf`.

## If something goes wrong

- If API/model generation fails, the user sees an inline error next to the button.
- If PDF creation fails, the modal shows a PDF generation error.
