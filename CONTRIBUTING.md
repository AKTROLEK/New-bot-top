# 🤝 Contributing Guide | دليل المساهمة

Thank you for your interest in contributing to the Advanced Arabic Discord Bot System!

<div dir="rtl">

شكراً لاهتمامك بالمساهمة في نظام البوت المتقدم!

</div>

## How to Contribute | كيفية المساهمة

### 1. Fork the Repository

Click the "Fork" button at the top right of the repository page.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/New-bot-top.git
cd New-bot-top
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 4. Make Your Changes

- Follow the existing code style
- Add comments in Arabic for user-facing features
- Add comments in English for technical/internal code
- Test your changes thoroughly

### 5. Commit Your Changes

```bash
git add .
git commit -m "feat: Add new feature" # or "fix: Fix bug"
```

Commit message format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

### 6. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 7. Create a Pull Request

Go to the original repository and click "New Pull Request"

## Code Style Guidelines | إرشادات كتابة الكود

### JavaScript/Node.js

- Use ES6+ features
- Use `import/export` instead of `require`
- Use async/await instead of callbacks
- Follow existing naming conventions
- Add JSDoc comments for functions

Example:
```javascript
/**
 * Add user to support queue
 * @param {string} userId - Discord user ID
 * @param {string} category - Support category
 * @returns {Object} Result object with success status
 */
async function addToQueue(userId, category) {
  // Implementation
}
```

### Arabic Content

- All user-facing text must be in Arabic
- Store text in `src/locales/ar.json`
- Use i18n helper for translations
- Maintain consistent Arabic terminology

Example:
```javascript
// ❌ Bad
await interaction.reply('User added to queue');

// ✅ Good
await interaction.reply(i18n.t('support.queue_joined'));
```

### File Organization

```
src/
├── commands/           # Slash commands organized by category
│   ├── support/
│   ├── verification/
│   └── ...
├── events/            # Discord event handlers
├── handlers/          # Button, modal, and select menu handlers
├── services/          # Business logic services
├── models/            # Database models
├── utils/             # Utility functions
└── web/               # Web dashboard
```

## What to Contribute | ما يمكنك المساهمة به

### 🐛 Bug Fixes

- Fix existing bugs
- Improve error handling
- Add input validation

### ✨ New Features

Priority features:
- Complete auto-support routing system
- Advanced verification tests
- Streamer content analysis
- AI integration improvements
- Mobile-responsive dashboard
- Multi-server support
- API endpoints

### 📝 Documentation

- Improve README
- Add code comments
- Write tutorials
- Translate documentation
- Add examples

### 🎨 Design

- Improve UI/UX
- Add animations
- Create logos
- Design banners

### 🧪 Testing

- Write unit tests
- Add integration tests
- Test edge cases
- Report bugs

## Testing Your Changes | اختبار التغييرات

Before submitting:

1. **Test locally**
   ```bash
   npm start
   ```

2. **Check for errors**
   - Review console output
   - Check logs in `logs/` directory
   - Test all affected commands

3. **Test in Discord**
   - Create a test server
   - Invite your bot
   - Test all new features
   - Verify existing features still work

4. **Test the dashboard** (if modified)
   ```bash
   npm run web
   ```
   - Test all pages
   - Check mobile responsiveness
   - Verify authentication

## Pull Request Guidelines | إرشادات طلبات السحب

### PR Title

Use clear, descriptive titles:
- ✅ `feat: Add streamer weekly report command`
- ✅ `fix: Resolve support queue routing issue`
- ❌ `Update files`
- ❌ `Fix bug`

### PR Description

Include:
1. **What** - What changes were made
2. **Why** - Why the changes were necessary
3. **How** - How the changes work
4. **Testing** - How you tested the changes
5. **Screenshots** - If UI changes were made

Example:
```markdown
## Changes
Added weekly report command for streamers

## Why
Streamers need to see their weekly performance

## How
- Added new command `/تقرير-أسبوعي`
- Queries database for last 7 days of content
- Displays statistics in embed
- Calculates performance rating

## Testing
- Tested with multiple streamers
- Verified data accuracy
- Checked edge cases (new streamers, no content)

## Screenshots
[Add screenshot here]
```

### Code Review

Your PR will be reviewed for:
- Code quality
- Arabic translations
- Performance
- Security
- Compatibility
- Documentation

Be ready to make changes based on feedback.

## Community Guidelines | إرشادات المجتمع

### Be Respectful

- Be kind and respectful to all contributors
- Accept constructive criticism gracefully
- Help others learn and grow

### Be Patient

- Reviews may take time
- Be patient with feedback
- Some changes may need discussion

### Ask Questions

Don't hesitate to:
- Ask for help
- Request clarification
- Suggest improvements
- Share ideas

## Need Help? | تحتاج مساعدة؟

- Open an [issue](https://github.com/AKTROLEK/New-bot-top/issues)
- Join our Discord server (coming soon)
- Read the [documentation](README.md)

## License | الترخيص

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉

<div dir="rtl">

شكراً لمساهمتك! 🎉

</div>
