const express = require('express');
const router = express.Router();
const Flow = require('../models/Flow');

// Serve the JavaScript file for the chatbot
router.get('/:flowId/script.js', async (req, res) => {
  try {
    const flow = await Flow.findById(req.params.flowId);
    if (!flow) {
      return res.status(404).send('Flow not found');
    }

    // Serve a JavaScript file that initializes the chatbot
    const script = `
      window.initChatbot = function(config) {
        const chatbot = document.getElementById('chatbot');
        if (!chatbot) return;

        // Create a container for the React app
        chatbot.style.width = '100%';
        chatbot.style.maxWidth = '400px';
        chatbot.style.height = '500px';
        chatbot.style.border = '1px solid #e5e7eb';
        chatbot.style.borderRadius = '8px';
        chatbot.style.overflow = 'hidden';

        // Load the chatbot React app (client-side rendering)
        const iframe = document.createElement('iframe');
        iframe.src = \`${process.env.APP_URL}/chatbot/\${config.flowId}?theme=\${config.theme}\`;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        chatbot.appendChild(iframe);
      };
    `;

    res.set('Content-Type', 'application/javascript');
    res.send(script);
  } catch (error) {
    res.status(500).send('Error serving chatbot script');
  }
});

// Serve the chatbot page for iframe
router.get('/:flowId', async (req, res) => {
  try {
    const flow = await Flow.findById(req.params.flowId);
    if (!flow) {
      return res.status(404).send('Flow not found');
    }

    const theme = req.query.theme || 'light';
    // Render a simple HTML page with the ChatbotPreview component
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Chatbot</title>
          <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet">
          <style>
            body { margin: 0; font-family: Arial, sans-serif; }
            #root { width: 100%; height: 100vh; }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script type="text/babel">
            const ChatbotPreview = ${JSON.stringify(ChatbotPreview.toString())};
            const nodes = ${JSON.stringify(flow.nodes)};
            const edges = ${JSON.stringify(flow.edges)};
            const themes = ${JSON.stringify(themes)};

            function App() {
              const themeStyles = themes['${theme}'].colors;
              return (
                <div style={{
                  '--primary': themeStyles.primary,
                  '--secondary': themeStyles.secondary,
                  '--success': themeStyles.success,
                  '--danger': themeStyles.danger,
                  '--background': themeStyles.background,
                  '--sidebar': themeStyles.sidebar,
                  '--text': themeStyles.text,
                  '--border': themeStyles.border,
                }}>
                  <ChatbotPreview nodes={nodes} edges={edges} />
                </div>
              );
            }

            ReactDOM.render(<App />, document.getElementById('root'));
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send('Error serving chatbot');
  }
});

module.exports = router;