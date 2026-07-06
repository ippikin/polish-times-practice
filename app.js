/**
 * Polish Time Listening Practice App
 * Logic, State Management, Voice Synthesis and Polish Time Grammatical Translator
 */

class PolishTimesPractice {
  constructor() {
    // State Initialization
    this.timeFormat = '24h';      // '24h' | '12h' | 'mixed'
    this.minuteInterval = '5min'; // '5min' | '1min'
    this.timeOfDay = 'all';       // 'all' | 'am' | 'pm'
    
    this.currentHours = null;
    this.currentMinutes = null;
    this.currentStyle = null;     // '12h' | '24h' (the style used for current round speech)
    
    this.speechRate = 1.0;
    this.synth = window.speechSynthesis;
    this.polishVoice = null;
    this.voices = [];
    
    // Stats State
    this.stats = {
      correct: 0,
      total: 0,
      streak: 0,
      maxStreak: 0
    };
    
    // History log
    this.history = [];
    
    // UI Selectors
    this.selectors = {
      playBtn: document.getElementById('play-btn'),
      playSlowBtn: document.getElementById('play-slow-btn'),
      userInput: document.getElementById('user-input'),
      checkBtn: document.getElementById('check-btn'),
      revealBtn: document.getElementById('reveal-btn'),
      skipBtn: document.getElementById('skip-btn'),
      feedbackEl: document.getElementById('feedback'),
      feedbackTitle: document.getElementById('feedback-title'),
      feedbackMessage: document.getElementById('feedback-message'),
      feedbackSpelling: document.getElementById('feedback-spelling'),
      voiceSelect: document.getElementById('voice-select'),
      statsCorrect: document.getElementById('stats-correct'),
      statsTotal: document.getElementById('stats-total'),
      statsAccuracy: document.getElementById('stats-accuracy'),
      statsStreak: document.getElementById('stats-streak'),
      statsMaxStreak: document.getElementById('stats-max-streak'),
      historyList: document.getElementById('history-list'),
      resetStatsBtn: document.getElementById('reset-stats-btn'),
      voiceWarning: document.getElementById('voice-warning'),
      guideToggleBtn: document.getElementById('guide-toggle-btn'),
      guideContent: document.getElementById('guide-content')
    };
  }

  init() {
    this.loadStateFromStorage();
    this.setupEventListeners();
    this.initVoices();
    
    // Web Speech API voices are loaded asynchronously in some browsers
    if (this.synth && this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.initVoices();
    }
    
    // Start first round
    this.newRound();
  }

  loadStateFromStorage() {
    // Stats
    const savedStats = localStorage.getItem('pl_time_stats');
    if (savedStats) {
      try {
        this.stats = JSON.parse(savedStats);
      } catch (e) {
        console.error('Failed to parse saved stats', e);
      }
    }
    
    // Settings presets
    const savedFormat = localStorage.getItem('pl_time_format');
    if (savedFormat) this.timeFormat = savedFormat;
    
    const savedInterval = localStorage.getItem('pl_time_interval');
    if (savedInterval) this.minuteInterval = savedInterval;
    
    const savedPeriod = localStorage.getItem('pl_time_period');
    if (savedPeriod) this.timeOfDay = savedPeriod;
    
    this.updateActivePresetsUI();

    // History
    const savedHistory = localStorage.getItem('pl_time_history');
    if (savedHistory) {
      try {
        this.history = JSON.parse(savedHistory);
        this.renderHistory();
      } catch (e) {
        console.error('Failed to parse saved history', e);
      }
    }
    
    // Speech Rate
    const savedRate = localStorage.getItem('pl_time_rate');
    if (savedRate) {
      this.speechRate = parseFloat(savedRate);
    }
    this.updateStatsUI();
  }

  saveStateToStorage() {
    localStorage.setItem('pl_time_stats', JSON.stringify(this.stats));
    localStorage.setItem('pl_time_format', this.timeFormat);
    localStorage.setItem('pl_time_interval', this.minuteInterval);
    localStorage.setItem('pl_time_period', this.timeOfDay);
    localStorage.setItem('pl_time_history', JSON.stringify(this.history));
    localStorage.setItem('pl_time_rate', this.speechRate);
  }

  setupEventListeners() {
    // Play button
    this.selectors.playBtn.addEventListener('click', () => {
      this.speechRate = 1.0;
      this.saveStateToStorage();
      this.speakCurrentTime(1.0);
      this.selectors.userInput.focus();
    });
    this.selectors.playSlowBtn.addEventListener('click', () => {
      this.speechRate = 0.55;
      this.saveStateToStorage();
      this.speakCurrentTime(0.55);
      this.selectors.userInput.focus();
    });
    
    // Check answer
    this.selectors.checkBtn.addEventListener('click', () => this.checkAnswer());
    this.selectors.userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.checkAnswer();
      }
    });

    // Reveal & Skip
    this.selectors.revealBtn.addEventListener('click', () => this.revealAnswer());
    this.selectors.skipBtn.addEventListener('click', () => this.skipRound());
    
    // Settings Presets (Format)
    document.querySelectorAll('#format-presets .btn-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.timeFormat = e.target.dataset.value;
        this.updateActivePresetsUI();
        this.saveStateToStorage();
        this.newRound();
      });
    });

    // Settings Presets (Interval)
    document.querySelectorAll('#interval-presets .btn-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.minuteInterval = e.target.dataset.value;
        this.updateActivePresetsUI();
        this.saveStateToStorage();
        this.newRound();
      });
    });

    // Settings Presets (Period)
    document.querySelectorAll('#period-presets .btn-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.timeOfDay = e.target.dataset.value;
        this.updateActivePresetsUI();
        this.saveStateToStorage();
        this.newRound();
      });
    });

    // Reset stats
    this.selectors.resetStatsBtn.addEventListener('click', () => this.resetStats());
    
    // Voice select change
    this.selectors.voiceSelect.addEventListener('change', (e) => {
      const selectedIndex = e.target.value;
      if (selectedIndex !== '') {
        this.polishVoice = this.voices[selectedIndex];
        this.speakCurrentTime();
      }
    });

    // Grammar guide toggle
    this.selectors.guideToggleBtn.addEventListener('click', () => {
      const isCollapsed = this.selectors.guideContent.classList.contains('collapsed');
      if (isCollapsed) {
        this.selectors.guideContent.classList.remove('collapsed');
        this.selectors.guideToggleBtn.textContent = 'Ukryj ściągę (Hide grammar guide)';
      } else {
        this.selectors.guideContent.classList.add('collapsed');
        this.selectors.guideToggleBtn.textContent = 'Pokaż ściągę (Show grammar guide)';
      }
    });
  }

  updateActivePresetsUI() {
    // Format
    document.querySelectorAll('#format-presets .btn-preset').forEach(btn => {
      if (btn.dataset.value === this.timeFormat) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // Interval
    document.querySelectorAll('#interval-presets .btn-preset').forEach(btn => {
      if (btn.dataset.value === this.minuteInterval) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Period
    document.querySelectorAll('#period-presets .btn-preset').forEach(btn => {
      if (btn.dataset.value === this.timeOfDay) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  initVoices() {
    if (!this.synth) return;
    
    const allVoices = this.synth.getVoices();
    this.voices = allVoices.filter(voice => voice.lang.includes('pl-PL') || voice.lang.startsWith('pl'));
    
    this.selectors.voiceSelect.innerHTML = '';
    
    if (this.voices.length === 0) {
      this.selectors.voiceSelect.innerHTML = '<option value="">Brak polskiego głosu - używanie domyślnego (No Polish voice found - default fallback)</option>';
      this.selectors.voiceWarning.style.display = 'block';
      
      this.voices = allVoices;
      allVoices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;
        this.selectors.voiceSelect.appendChild(option);
      });
      this.polishVoice = allVoices.find(voice => voice.default) || allVoices[0];
    } else {
      this.selectors.voiceWarning.style.display = 'none';
      
      this.voices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;
        if (voice.name.includes('Google') || voice.name.includes('Natural') || voice.name.includes('Maja') || voice.name.includes('Jan')) {
          option.selected = true;
          this.polishVoice = voice;
        }
        this.selectors.voiceSelect.appendChild(option);
      });
      
      if (!this.polishVoice) {
        this.polishVoice = this.voices[0];
      }
    }
  }

  numberToCardinal(n) {
    if (n === 0) return 'zero';
    
    const units = ['', 'jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć'];
    const teens = ['dziesięć', 'jedenaście', 'dwanaście', 'trzynaście', 'czternaście', 'piętnaście', 'szesnaście', 'siedemnaście', 'osiemnaście', 'dziewiętnaście'];
    const tens = ['', '', 'dwadzieścia', 'trzydzieści', 'czterdzieści', 'pięćdziesiąt'];

    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    
    let tensVal = Math.floor(n / 10);
    let unitsVal = n % 10;
    
    let parts = [];
    if (tensVal > 0) parts.push(tens[tensVal]);
    if (unitsVal > 0) parts.push(units[unitsVal]);
    
    return parts.join(' ');
  }

  timeTo24hSpelling(h, m) {
    const hoursFeminine = [
      'zero', 'pierwsza', 'druga', 'trzecia', 'czwarta', 'piąta', 'szósta', 'siódma', 'ósma', 'dziewiąta', 'dziesiąta',
      'jedenasta', 'dwunasta', 'trzynasta', 'czternasta', 'piętnasta', 'szesnasta', 'siedemnasta', 'osiemnasta',
      'dziewiętnasta', 'dwudziesta', 'dwudziesta pierwsza', 'dwudziesta druga', 'dwudziesta trzecia'
    ];
    
    let hWord = hoursFeminine[h];
    
    if (m === 0) {
      if (h === 0) return 'północ'; // 00:00 -> midnight (very natural fallback)
      return hWord;
    }
    
    let mWord = '';
    if (m < 10) {
      mWord = 'zero ' + this.numberToCardinal(m);
    } else {
      mWord = this.numberToCardinal(m);
    }
    
    return `${hWord} ${mWord}`;
  }

  timeTo12hSpelling(h, m) {
    const hoursNom = [
      '', 'pierwsza', 'druga', 'trzecia', 'czwarta', 'piąta', 'szósta', 'siódma', 'ósma', 'dziewiąta', 'dziesiąta', 'jedenasta', 'dwunasta'
    ];
    const hoursGenLoc = [
      '', 'pierwszej', 'drugiej', 'trzeciej', 'czwartej', 'piątej', 'szóstej', 'siódmej', 'ósmej', 'dziewiątej', 'dziesiątej', 'jedenastej', 'dwunastej'
    ];
    
    // Map to 1-12 range
    let infH = h % 12;
    if (infH === 0) infH = 12;
    
    // On the hour
    if (m === 0) {
      return hoursNom[infH];
    }
    
    // Half past
    if (m === 30) {
      let nextH = infH === 12 ? 1 : infH + 1;
      return `wpół do ${hoursGenLoc[nextH]}`;
    }
    
    // Minutes 1-29
    if (m < 30) {
      let mWord = this.numberToCardinal(m);
      return `${mWord} po ${hoursGenLoc[infH]}`;
    }
    
    // Minutes 31-59 (spoken as "za [minutes_to] [next_hour]")
    let remainingMin = 60 - m;
    let mWord = this.numberToCardinal(remainingMin);
    let nextH = infH === 12 ? 1 : infH + 1;
    
    return `za ${mWord} ${hoursNom[nextH]}`;
  }

  generateRandomTime() {
    // Hour generation based on Time of Day filter
    let h;
    if (this.timeOfDay === 'am') {
      h = Math.floor(Math.random() * 12); // 0 to 11
    } else if (this.timeOfDay === 'pm') {
      h = Math.floor(Math.random() * 12) + 12; // 12 to 23
    } else {
      h = Math.floor(Math.random() * 24); // 0 to 23
    }

    // Minute generation based on Interval filter
    let m;
    if (this.minuteInterval === '5min') {
      m = Math.floor(Math.random() * 12) * 5; // Multiples of 5
    } else {
      m = Math.floor(Math.random() * 60); // 0 to 59
    }

    // Select format style
    let style;
    if (this.timeFormat === '24h') {
      style = '24h';
    } else if (this.timeFormat === '12h') {
      style = '12h';
    } else {
      // Mixed
      style = Math.random() < 0.5 ? '12h' : '24h';
    }

    return { hours: h, minutes: m, style };
  }

  newRound() {
    const roundData = this.generateRandomTime();
    this.currentHours = roundData.hours;
    this.currentMinutes = roundData.minutes;
    this.currentStyle = roundData.style;
    
    // Re-enable inputs first
    this.selectors.userInput.disabled = false;
    this.selectors.checkBtn.disabled = false;
    this.selectors.revealBtn.disabled = false;
    
    this.selectors.userInput.value = '';
    this.selectors.userInput.focus();
    
    // Hide feedback
    this.selectors.feedbackEl.className = 'feedback hidden';
    
    setTimeout(() => {
      this.speakCurrentTime();
    }, 150);
  }

  speakCurrentTime(speed = null) {
    if (this.currentHours === null || this.currentMinutes === null) return;
    
    const rate = speed !== null ? speed : this.speechRate;
    const words = this.currentStyle === '12h'
      ? this.timeTo12hSpelling(this.currentHours, this.currentMinutes)
      : this.timeTo24hSpelling(this.currentHours, this.currentMinutes);
      
    this.speakText(words, rate);
  }

  speakText(text, speed = 1.0) {
    if (!this.synth) return;
    
    this.synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    if (this.polishVoice) {
      utterance.voice = this.polishVoice;
    }
    
    utterance.lang = 'pl-PL';
    utterance.rate = speed;
    utterance.pitch = 1.0;
    
    const activeBtn = speed < 0.8 ? this.selectors.playSlowBtn : this.selectors.playBtn;
    activeBtn.classList.add('playing');
    
    utterance.onend = () => {
      activeBtn.classList.remove('playing');
    };
    utterance.onerror = () => {
      activeBtn.classList.remove('playing');
    };
    
    this.synth.speak(utterance);
  }

  parseUserTime(inputStr) {
    inputStr = inputStr.trim().replace(/\s+/g, '');
    
    // Try to parse H:MM, HH:MM, H.MM, HH.MM, etc.
    const separatorMatch = inputStr.match(/^(\d{1,2})[:.-](\d{2})$/);
    if (separatorMatch) {
      return {
        hours: parseInt(separatorMatch[1], 10),
        minutes: parseInt(separatorMatch[2], 10)
      };
    }
    
    // Try to parse 3 or 4 digits: 915 -> 9:15, 1430 -> 14:30
    const digitMatch = inputStr.match(/^(\d{1,2})(\d{2})$/);
    if (digitMatch) {
      return {
        hours: parseInt(digitMatch[1], 10),
        minutes: parseInt(digitMatch[2], 10)
      };
    }
    
    // Single number representing just hours (e.g. "9" -> 9:00, "14" -> 14:00)
    const hourOnlyMatch = inputStr.match(/^(\d{1,2})$/);
    if (hourOnlyMatch) {
      return {
        hours: parseInt(hourOnlyMatch[1], 10),
        minutes: 0
      };
    }
    
    return null;
  }

  checkAnswer() {
    const userValString = this.selectors.userInput.value.trim();
    if (userValString === '') return;
    
    const parsedTime = this.parseUserTime(userValString);
    
    if (!parsedTime || parsedTime.hours < 0 || parsedTime.hours > 24 || parsedTime.minutes < 0 || parsedTime.minutes > 59) {
      // Alert user of invalid format
      alert('Niepoprawny format. Wpisz czas w formacie HH:MM (np. 14:30 lub 2:05) (Invalid format. Enter time in HH:MM format like 14:30 or 2:05)');
      return;
    }
    
    // Check minutes correctness
    const isMinuteCorrect = parsedTime.minutes === this.currentMinutes;
    let isHourCorrect = false;
    
    // Check hour correctness based on the style spoken
    if (this.currentStyle === '24h') {
      // 24-hour style: hours must match directly (allowing user to type 0 or 24 for midnight)
      const userMod24 = parsedTime.hours % 24;
      const targetMod24 = this.currentHours % 24;
      isHourCorrect = userMod24 === targetMod24;
    } else {
      // 12-hour style: hours match modulo 12
      const userMod12 = parsedTime.hours % 12;
      const targetMod12 = this.currentHours % 12;
      isHourCorrect = userMod12 === targetMod12;
    }
    
    const isCorrect = isHourCorrect && isMinuteCorrect;
    
    const spelling = this.currentStyle === '12h'
      ? this.timeTo12hSpelling(this.currentHours, this.currentMinutes)
      : this.timeTo24hSpelling(this.currentHours, this.currentMinutes);
      
    // Update Stats
    this.stats.total += 1;
    if (isCorrect) {
      this.stats.correct += 1;
      this.stats.streak += 1;
      if (this.stats.streak > this.stats.maxStreak) {
        this.stats.maxStreak = this.stats.streak;
      }
      this.showFeedback(true, spelling);
    } else {
      this.stats.streak = 0;
      this.showFeedback(false, spelling);
    }
    
    // Add to history
    const targetString = `${String(this.currentHours).padStart(2, '0')}:${String(this.currentMinutes).padStart(2, '0')}`;
    const userString = `${String(parsedTime.hours).padStart(2, '0')}:${String(parsedTime.minutes).padStart(2, '0')}`;
    
    this.history.unshift({
      id: Date.now(),
      targetTime: targetString,
      style: this.currentStyle,
      guess: userString,
      correct: isCorrect,
      spelling: spelling
    });
    
    if (this.history.length > 20) {
      this.history.pop();
    }
    
    // Disable inputs
    this.selectors.userInput.disabled = true;
    this.selectors.checkBtn.disabled = true;
    this.selectors.revealBtn.disabled = true;
    
    this.saveStateToStorage();
    this.updateStatsUI();
    this.renderHistory();
    
    this.setupNextRoundButton();
  }

  revealAnswer() {
    if (this.currentHours === null || this.currentMinutes === null) return;
    
    const spelling = this.currentStyle === '12h'
      ? this.timeTo12hSpelling(this.currentHours, this.currentMinutes)
      : this.timeTo24hSpelling(this.currentHours, this.currentMinutes);
      
    this.stats.total += 1;
    this.stats.streak = 0;
    
    this.showFeedback(false, spelling, true);
    
    const targetString = `${String(this.currentHours).padStart(2, '0')}:${String(this.currentMinutes).padStart(2, '0')}`;
    
    this.history.unshift({
      id: Date.now(),
      targetTime: targetString,
      style: this.currentStyle,
      guess: null,
      correct: false,
      spelling: spelling,
      revealed: true
    });
    
    if (this.history.length > 20) {
      this.history.pop();
    }
    
    this.selectors.userInput.disabled = true;
    this.selectors.checkBtn.disabled = true;
    this.selectors.revealBtn.disabled = true;
    
    this.saveStateToStorage();
    this.updateStatsUI();
    this.renderHistory();
    
    this.setupNextRoundButton();
  }

  skipRound() {
    this.newRound();
  }

  showFeedback(isCorrect, spelling, isRevealed = false) {
    this.selectors.feedbackEl.classList.remove('hidden', 'correct', 'incorrect');
    
    const existingNext = document.getElementById('next-round-btn');
    if (existingNext) existingNext.remove();
    
    const displayTime = `${String(this.currentHours).padStart(2, '0')}:${String(this.currentMinutes).padStart(2, '0')}`;
    const styleLabel = this.currentStyle === '12h' ? '12-godzinny (12h clock)' : '24-godzinny (24h clock)';
    
    if (isCorrect) {
      this.selectors.feedbackEl.classList.add('correct');
      this.selectors.feedbackTitle.textContent = 'Dobrze! (Correct!) 🎉';
      this.selectors.feedbackMessage.innerHTML = `Czas (Time): <strong>${displayTime}</strong> <span style="font-size:0.8rem; color:var(--text-secondary);">[${styleLabel}]</span>`;
    } else {
      this.selectors.feedbackEl.classList.add('incorrect');
      if (isRevealed) {
        this.selectors.feedbackTitle.textContent = 'Odkryty (Revealed)';
      } else {
        this.selectors.feedbackTitle.textContent = 'Źle (Incorrect) 😢';
      }
      this.selectors.feedbackMessage.innerHTML = `Poprawna odpowiedź (Correct answer): <strong>${displayTime}</strong> <span style="font-size:0.8rem; color:var(--text-secondary);">[${styleLabel}]</span>`;
    }
    
    this.selectors.feedbackSpelling.innerHTML = `Słownie (In words): <span class="polish-spelling-highlight">${spelling}</span>`;
  }

  setupNextRoundButton() {
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-primary next-round-btn';
    nextBtn.id = 'next-round-btn';
    nextBtn.innerHTML = 'Następny (Next) <span class="kbd">Enter</span>';
    
    const existingNext = document.getElementById('next-round-btn');
    if (existingNext) existingNext.remove();
    
    this.selectors.feedbackEl.appendChild(nextBtn);
    nextBtn.focus();
    
    nextBtn.addEventListener('click', () => {
      nextBtn.remove();
      this.newRound();
    });
    
    const nextKeyListener = (e) => {
      if (e.key === 'Enter') {
        document.removeEventListener('keydown', nextKeyListener);
        const btn = document.getElementById('next-round-btn');
        if (btn) {
          btn.click();
        }
      }
    };
    document.addEventListener('keydown', nextKeyListener);
  }

  updateStatsUI() {
    const accuracy = this.stats.total > 0 
      ? Math.round((this.stats.correct / this.stats.total) * 100) 
      : 0;
      
    this.selectors.statsCorrect.textContent = this.stats.correct;
    this.selectors.statsTotal.textContent = this.stats.total;
    this.selectors.statsAccuracy.textContent = `${accuracy}%`;
    this.selectors.statsStreak.textContent = this.stats.streak;
    this.selectors.statsMaxStreak.textContent = this.stats.maxStreak;
  }

  renderHistory() {
    this.selectors.historyList.innerHTML = '';
    
    if (this.history.length === 0) {
      this.selectors.historyList.innerHTML = '<li class="history-empty">Brak historii sesji (No session history yet)</li>';
      return;
    }
    
    this.history.forEach(item => {
      const li = document.createElement('li');
      li.className = `history-item ${item.correct ? 'history-correct' : 'history-incorrect'}`;
      
      const badge = item.correct 
        ? '<span class="history-badge badge-correct">✓</span>' 
        : '<span class="history-badge badge-incorrect">✗</span>';
        
      const guessStr = item.revealed 
        ? '<i>revealed</i>' 
        : (item.guess !== null ? item.guess : 'None');
        
      const styleLabel = item.style === '12h' ? '12h' : '24h';
      
      li.innerHTML = `
        <div class="history-header">
          ${badge}
          <span class="history-number">${item.targetTime}</span>
          <span style="font-size:0.75rem; background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:4px; color:var(--text-secondary);">${styleLabel}</span>
          <span class="history-guess">Guess: ${guessStr}</span>
          <button class="history-replay-btn" title="Replay Audio" data-text="${item.spelling}">🔊</button>
        </div>
        <div class="history-spelling">${item.spelling}</div>
      `;
      
      const replayBtn = li.querySelector('.history-replay-btn');
      replayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const textToSpeak = e.currentTarget.dataset.text;
        this.speakText(textToSpeak, 1.0);
      });
      
      this.selectors.historyList.appendChild(li);
    });
  }

  resetStats() {
    if (confirm('Czy na pewno chcesz zresetować statystyki? (Are you sure you want to reset stats?)')) {
      this.stats = {
        correct: 0,
        total: 0,
        streak: 0,
        maxStreak: 0
      };
      this.history = [];
      this.saveStateToStorage();
      this.updateStatsUI();
      this.renderHistory();
      this.newRound();
    }
  }
}

// Instantiate and start on load
window.addEventListener('DOMContentLoaded', () => {
  const app = new PolishTimesPractice();
  app.init();
  window.appInstance = app;
});
