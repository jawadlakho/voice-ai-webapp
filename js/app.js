// Voice AI Web Application
// Text-to-Speech & Speech-to-Text with full controls

(function(){
    // --------------------- DOM Elements -------------------------
    // TTS side
    const ttsTextarea = document.getElementById('ttsText');
    const ttsLangSelect = document.getElementById('ttsLang');
    const ttsVoiceSelect = document.getElementById('ttsVoice');
    const rateSlider = document.getElementById('rateSlider');
    const rateValueSpan = document.getElementById('rateValue');
    const speakBtn = document.getElementById('speakBtn');
    const stopSpeechBtn = document.getElementById('stopSpeechBtn');
    const ttsStatusSpan = document.getElementById('ttsStatus');

    // STT side
    const micBtn = document.getElementById('micBtn');
    const sttStatusSpan = document.getElementById('sttStatus');
    const sttOutput = document.getElementById('sttOutput');
    const sttLangSelect = document.getElementById('sttLangSelect');
    const copySttBtn = document.getElementById('copySttBtn');
    const downloadSttBtn = document.getElementById('downloadSttBtn');

    // TTS copy/download
    const copyTtsTextBtn = document.getElementById('copyTtsTextBtn');
    const downloadTtsTextBtn = document.getElementById('downloadTtsTextBtn');

    // --------------------- GLOBALS -----------------------------
    let currentUtterance = null;
    let availableVoices = [];
    let speechSupported = window.speechSynthesis;
    let isSpeaking = false;
    let currentTtsTextForCopy = "";

    // STT recognition instance
    let recognition = null;
    let isListening = false;

    // --------------------- Language List for TTS -----------------
    const languageMap = [
        { code: "en-US", name: "English (US)" },
        { code: "en-GB", name: "English (UK)" },
        { code: "es-ES", name: "Spanish" },
        { code: "fr-FR", name: "French" },
        { code: "de-DE", name: "German" },
        { code: "it-IT", name: "Italian" },
        { code: "ja-JP", name: "Japanese" },
        { code: "ko-KR", name: "Korean" },
        { code: "zh-CN", name: "Chinese (Mandarin)" },
        { code: "hi-IN", name: "Hindi" },
        { code: "pt-BR", name: "Portuguese (Brazil)" },
        { code: "ru-RU", name: "Russian" },
        { code: "ar-EG", name: "Arabic" }
    ];

    function populateTtsLanguages() {
        ttsLangSelect.innerHTML = '';
        languageMap.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.code;
            option.textContent = lang.name;
            ttsLangSelect.appendChild(option);
        });
        ttsLangSelect.value = "en-US";
    }

    // Update voice dropdown based on selected language
    function updateVoicesForLanguage() {
        const selectedLang = ttsLangSelect.value;
        const filtered = availableVoices.filter(voice => 
            voice.lang.startsWith(selectedLang.split('-')[0]) || voice.lang === selectedLang
        );
        const voicesToShow = filtered.length ? filtered : availableVoices.filter(v => v.lang.includes('en'));
        
        ttsVoiceSelect.innerHTML = '';
        if(voicesToShow.length === 0) {
            const option = document.createElement('option');
            option.textContent = 'Default voice';
            option.value = '';
            ttsVoiceSelect.appendChild(option);
        } else {
            voicesToShow.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.lang})`;
                ttsVoiceSelect.appendChild(option);
            });
        }
        
        // Try to set a preferred voice (Google or natural sounding)
        const preferred = voicesToShow.find(v => v.name.includes('Google') || v.name.includes('Natural'));
        if(preferred) {
            ttsVoiceSelect.value = preferred.name;
        }
    }

    function loadVoicesAndPopulate() {
        if(!speechSupported) {
            ttsStatusSpan.innerText = "❌ Speech synthesis not supported";
            return;
        }
        availableVoices = speechSynthesis.getVoices();
        if(availableVoices.length === 0) {
            speechSynthesis.addEventListener('voiceschanged', () => {
                availableVoices = speechSynthesis.getVoices();
                updateVoicesForLanguage();
            });
        } else {
            updateVoicesForLanguage();
        }
    }

    // On language change => refresh voice list
    ttsLangSelect.addEventListener('change', () => updateVoicesForLanguage());

    // Rate slider display
    rateSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        rateValueSpan.innerText = val.toFixed(2) + 'x';
    });

    // SPEAK FUNCTION
    function speakText() {
        if(!speechSupported) {
            alert("Web Speech API not supported in this browser.");
            return;
        }
        if(isSpeaking) {
            stopSpeech();
        }
        
        const text = ttsTextarea.value.trim();
        if(text === "") {
            ttsStatusSpan.innerText = "⚠️ Please enter text to speak.";
            return;
        }
        
        currentTtsTextForCopy = text;
        const utterance = new SpeechSynthesisUtterance(text);
        
        const selectedVoiceName = ttsVoiceSelect.value;
        if(selectedVoiceName) {
            const voice = availableVoices.find(v => v.name === selectedVoiceName);
            if(voice) utterance.voice = voice;
        }
        
        utterance.lang = ttsLangSelect.value;
        utterance.rate = parseFloat(rateSlider.value);
        utterance.pitch = 1.0;
        
        utterance.onstart = () => {
            isSpeaking = true;
            ttsStatusSpan.innerText = "🔊 Speaking ...";
        };
        
        utterance.onend = () => {
            isSpeaking = false;
            ttsStatusSpan.innerText = "✅ Speech finished";
        };
        
        utterance.onerror = (e) => {
            console.error(e);
            isSpeaking = false;
            ttsStatusSpan.innerText = "⚠️ Speech error";
        };
        
        currentUtterance = utterance;
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
    }
    
    function stopSpeech() {
        if(speechSupported) {
            speechSynthesis.cancel();
            isSpeaking = false;
            if(currentUtterance) currentUtterance = null;
            ttsStatusSpan.innerText = "⏹️ Stopped";
        }
    }

    // Copy TTS text
    function copyTtsText() {
        const textToCopy = ttsTextarea.value.trim() || currentTtsTextForCopy;
        if(textToCopy) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                ttsStatusSpan.innerText = "📋 Text copied to clipboard!";
                setTimeout(() => { 
                    if(!isSpeaking) ttsStatusSpan.innerText = "⚡ Ready"; 
                }, 1500);
            }).catch(() => {
                alert("Failed to copy text");
            });
        } else {
            alert("No text to copy");
        }
    }
    
    function downloadTtsAsText() {
        const content = ttsTextarea.value.trim() || currentTtsTextForCopy || "No text content";
        const blob = new Blob([content], {type: "text/plain"});
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `voice_ai_transcript_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        ttsStatusSpan.innerText = "💾 Transcript downloaded";
        setTimeout(() => { 
            if(!isSpeaking) ttsStatusSpan.innerText = "⚡ Ready"; 
        }, 1200);
    }

    // --------------------- SPEECH TO TEXT (Web Speech API) ----------------
    function initSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            sttStatusSpan.innerText = "❌ Speech Recognition not supported";
            micBtn.disabled = true;
            return false;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        
        recognition.onstart = () => {
            isListening = true;
            micBtn.innerHTML = "🔴 Stop Recording";
            micBtn.classList.add('mic-active');
            sttStatusSpan.innerText = "🎙️ Listening ... speak now";
        };
        
        recognition.onend = () => {
            isListening = false;
            micBtn.innerHTML = "🎙️ Start Recording";
            micBtn.classList.remove('mic-active');
            sttStatusSpan.innerText = "⏹️ Idle · Click mic to begin";
        };
        
        recognition.onerror = (event) => {
            console.error("STT error", event.error);
            let errorMsg = "⚠️ Error: ";
            if(event.error === 'not-allowed') errorMsg += "Microphone access denied";
            else if(event.error === 'no-speech') errorMsg += "No speech detected";
            else errorMsg += event.error;
            sttStatusSpan.innerText = errorMsg;
            isListening = false;
            micBtn.innerHTML = "🎙️ Start Recording";
            micBtn.classList.remove('mic-active');
        };
        
        recognition.onresult = (event) => {
            let final = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript + " ";
                }
            }
            if(final) {
                const currentText = sttOutput.value;
                sttOutput.value = currentText ? currentText + " " + final.trim() : final.trim();
                // Auto-scroll to bottom
                sttOutput.scrollTop = sttOutput.scrollHeight;
            }
        };
        
        return true;
    }
    
    function toggleSTT() {
        if(!recognition && !initSpeechRecognition()) return;
        
        if(isListening) {
            recognition.stop();
        } else {
            // Set language before starting
            recognition.lang = sttLangSelect.value;
            recognition.start();
        }
    }
    
    function copySttResult() {
        const text = sttOutput.value;
        if(text.trim() === "") {
            alert("No recognized text to copy.");
            return;
        }
        navigator.clipboard.writeText(text).then(() => {
            sttStatusSpan.innerText = "📋 Copied transcription!";
            setTimeout(() => { 
                if(!isListening) sttStatusSpan.innerText = "Idle · Click mic"; 
            }, 1500);
        }).catch(() => {
            alert("Failed to copy");
        });
    }
    
    function downloadSttResult() {
        const text = sttOutput.value;
        if(!text.trim()) {
            alert("No text to download");
            return;
        }
        const blob = new Blob([text], {type: "text/plain"});
        const a = document.createElement('a');
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = `stt_transcript_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        sttStatusSpan.innerText = "💾 Downloaded transcript";
        setTimeout(() => {
            if(!isListening) sttStatusSpan.innerText = "Idle · Click mic";
        }, 1500);
    }
    
    function clearSttOnLanguageChange() {
        // Optional: Ask user if they want to clear? We'll just keep text, but can add later
        // Not auto-clearing to preserve data
    }
    
    // Event binding
    speakBtn.addEventListener('click', speakText);
    stopSpeechBtn.addEventListener('click', stopSpeech);
    copyTtsTextBtn.addEventListener('click', copyTtsText);
    downloadTtsTextBtn.addEventListener('click', downloadTtsAsText);
    micBtn.addEventListener('click', toggleSTT);
    copySttBtn.addEventListener('click', copySttResult);
    downloadSttBtn.addEventListener('click', downloadSttResult);
    sttLangSelect.addEventListener('change', () => {
        if(recognition && isListening) {
            // Restart recognition with new language
            recognition.stop();
            setTimeout(() => {
                recognition.lang = sttLangSelect.value;
                recognition.start();
            }, 100);
        }
    });
    
    // Initialize everything
    populateTtsLanguages();
    
    if(speechSupported) {
        if(speechSynthesis.getVoices().length) {
            availableVoices = speechSynthesis.getVoices();
            updateVoicesForLanguage();
        } else {
            speechSynthesis.addEventListener('voiceschanged', () => {
                availableVoices = speechSynthesis.getVoices();
                updateVoicesForLanguage();
            });
        }
    }
    
    initSpeechRecognition();
    
    // Fallback for voice loading
    setTimeout(() => {
        if(availableVoices.length === 0 && speechSupported) {
            availableVoices = speechSynthesis.getVoices();
            updateVoicesForLanguage();
        }
    }, 300);
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        if(isSpeaking) speechSynthesis.cancel();
        if(isListening && recognition) recognition.abort();
    });
    
    // Add keyboard shortcut: Escape to stop speech
    document.addEventListener('keydown', (e) => {
        if(e.key === 'Escape' && isSpeaking) {
            stopSpeech();
        }
    });
    
    console.log("Voice AI App initialized successfully!");
})();