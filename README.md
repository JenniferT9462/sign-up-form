# Capstone Share-Out Sign-Up

A sign-up page for capstone share-outs, hosted on GitHub Pages. Sign-ups are saved to a Google Sheet.

## One-time setup

1. **Make the sheet.** Create a new Google Sheet (any name).
2. **Add the script.** In the sheet, go to **Extensions → Apps Script**. Delete what's there, paste in everything from [apps-script/Code.gs](apps-script/Code.gs), and click **Save**.
3. **Deploy it.** Click **Deploy → New deployment**. Click the gear icon and choose **Web app**. Set:
   - Execute as: **Me**
   - Who has access: **Anyone**

   Click **Deploy**, then approve the permissions. Google warns that the app "isn't verified" because you wrote it yourself: click **Advanced → Go to (project name)**.
4. **Copy the Web app URL** (it ends in `/exec`).
5. **Connect the page.** In `index.html`, find `const SCRIPT_URL = "";` and paste the URL between the quotes.
6. **Publish.** Push to GitHub and turn on Pages (**Settings → Pages → Deploy from branch → main / root**).

## Day to day

- **See who signed up:** open the **Signups** tab in your Google Sheet. You also get an email for each sign-up and cancellation. To turn the emails off, set `EMAIL_ME = false` in Code.gs.
- **Remove someone:** delete their row in the sheet. Their slot opens up again.
- **Change the time slots:** edit the `SLOTS` list near the top of the script in `index.html`.
- **If you edit Code.gs later:** go to **Deploy → Manage deployments → edit (pencil) → Version: New version → Deploy**. This keeps the same URL.
