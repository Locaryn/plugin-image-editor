(function () {
  "use strict";

  const CSS = `
:host {
  display: block;
  width: 100%;
  color: var(--text, #e8edf5);
  font-family: inherit;
  box-sizing: border-box;
}
* { box-sizing: border-box; }
.panel-container {
  width: 100%;
  max-width: 920px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.header-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--surface, rgba(255, 255, 255, 0.035));
  border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
  border-radius: var(--radius, 12px);
}
.title-wrap { display: flex; align-items: center; gap: 12px; }
.icon-box {
  width: 40px; height: 40px; border-radius: 10px;
  background: rgba(var(--accent-rgb, 110, 168, 254), 0.15);
  color: var(--accent, #6ea8fe);
  display: grid; place-items: center; font-size: 20px;
}
.title { font-size: 16px; font-weight: 700; color: var(--text, #e8edf5); }
.subtitle { font-size: 12px; color: var(--text-faint, #96a3b8); margin-top: 2px; }
.badge {
  display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 99px;
  font-size: 11px; font-weight: 600; background: rgba(101, 211, 145, 0.12);
  color: #65d391; border: 1px solid rgba(101, 211, 145, 0.25);
}
.field-card {
  display: flex; flex-direction: column; gap: 10px;
  background: var(--surface, rgba(255, 255, 255, 0.035));
  border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
  border-radius: var(--radius, 12px); padding: 16px;
}
.label {
  font-size: 11px; font-weight: 700; color: var(--text-dim, #94a3b8);
  text-transform: uppercase; letter-spacing: 0.06em;
}
.input, .textarea {
  width: 100%; border: 1px solid var(--border, rgba(255, 255, 255, 0.14));
  border-radius: var(--radius-sm, 8px); background: var(--bg, rgba(0, 0, 0, 0.25));
  color: inherit; padding: 10px 12px; font: inherit; font-size: 13px; outline: none;
}
.textarea { min-height: 80px; resize: vertical; }
.dropzone {
  border: 2px dashed var(--border, rgba(255, 255, 255, 0.2));
  border-radius: var(--radius-sm, 8px); padding: 24px; text-align: center;
  cursor: pointer; background: rgba(0, 0, 0, 0.15);
}
.btn-primary {
  width: 100%; padding: 12px; background: var(--accent, #6ea8fe);
  color: #0b101b; border: none; border-radius: var(--radius-sm, 8px);
  font-weight: 700; font-size: 14px; cursor: pointer;
}
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
`;

  class LocarynImageEditorPanel extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.prompt = "";
      this.imagePath = "";
      this.isProcessing = false;
    }

    connectedCallback() {
      this.render();
    }

    async processInpaint() {
      if (!this.prompt.trim() || this.isProcessing) return;
      this.isProcessing = true;
      this.render();
      try {
        const bridge = window.locaryn || window.LocarynPluginAPI;
        if (bridge && bridge.invokeExtensionTool) {
          await bridge.invokeExtensionTool("inpaint_image", {
            image_path: this.imagePath || "source.png",
            prompt: this.prompt,
            strength: 0.85
          });
        }
      } catch (err) {
        alert("Erreur de retouche: " + err);
      } finally {
        this.isProcessing = false;
        this.render();
      }
    }

    render() {
      this.shadowRoot.innerHTML = `
        <style>${CSS}</style>
        <div class="panel-container">
          <div class="header-card">
            <div class="title-wrap">
              <div class="icon-box">🖌️</div>
              <div>
                <div class="title">Studio Retouche & Inpainting</div>
                <div class="subtitle">Modification ciblée d'images par masque et invite textuelle</div>
              </div>
            </div>
            <div class="badge">Actif</div>
          </div>

          <div class="field-card">
            <label class="label">Image source à retoucher</label>
            <div class="dropzone" id="ie-dropzone">
              <div style="font-size: 24px; margin-bottom: 6px;">📂</div>
              <div style="font-weight: 600;">Glisser-déposer une image ou cliquer pour parcourir</div>
              <div style="font-size: 12px; color: var(--text-dim); margin-top: 4px;">PNG, JPG, WebP jusqu'à 20 Mo</div>
            </div>
          </div>

          <div class="field-card">
            <label class="label">Instruction de retouche (Prompt)</label>
            <textarea class="textarea" id="ie-prompt" placeholder="Ex: Remplacer l'arrière-plan par une forêt brumeuse au crépuscule...">${this.prompt}</textarea>
          </div>

          <button class="btn-primary" id="ie-btn" ${this.isProcessing || !this.prompt.trim() ? "disabled" : ""}>
            ${this.isProcessing ? "Retouche en cours..." : "Appliquer la retouche"}
          </button>
        </div>
      `;

      const promptEl = this.shadowRoot.querySelector("#ie-prompt");
      if (promptEl) {
        promptEl.addEventListener("input", (e) => {
          this.prompt = e.target.value;
          const btn = this.shadowRoot.querySelector("#ie-btn");
          if (btn) btn.disabled = !this.prompt.trim() || this.isProcessing;
        });
      }

      const btn = this.shadowRoot.querySelector("#ie-btn");
      if (btn) {
        btn.addEventListener("click", () => this.processInpaint());
      }
    }
  }

  if (!customElements.get("locaryn-image-editor-panel")) {
    customElements.define("locaryn-image-editor-panel", LocarynImageEditorPanel);
  }
})();
