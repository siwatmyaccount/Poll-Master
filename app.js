const app = {
    state: {
        currentUser: null,
        polls: [],
        view: 'feed',
        currentFilter: 'all'
    },

    init: function() {
        this.loadData();
        this.checkAuth();
        this.renderFilterBadges();
        this.updateDarkModeUI();
    },

    loadData: function() {
        const users = localStorage.getItem('pm_user');
        const polls = localStorage.getItem('pm_polls');
        const darkMode = localStorage.getItem('pm_darkmode') !== 'false';

        if (users) this.state.currentUser = JSON.parse(users);
        if (polls) this.state.polls = JSON.parse(polls);
        else this.seedData();

        if (darkMode) document.body.classList.add('dark-mode');
        else document.body.classList.remove('dark-mode');
    },

    seedData: function() {
        this.state.polls = [
            {
                id: 1701,
                question: "เสาร์อาทิตย์นี้ไปเที่ยวไหนดี?",
                category: "travel",
                options: [
                    { id: 'o1', text: "ทะเล", votes: 5 },
                    { id: 'o2', text: "ภูเขา", votes: 12 },
                    { id: 'o3', text: "นอนอยู่บ้าน", votes: 21 }
                ],
                createdBy: "Admin",
                voters: [],
                status: "active",
                timestamp: Date.now()
            },
            {
                id: 1702,
                question: "ชอบสัตว์อะไร",
                category: "general",
                options: [
                    { id: 'o1', text: "แมว", votes: 1 },
                    { id: 'o2', text: "หมา", votes: 0 }
                ],
                createdBy: "naka",
                voters: [],
                status: "ended",
                timestamp: Date.now() - 100000
            }
        ];
        this.saveData();
    },

    saveData: function() {
        localStorage.setItem('pm_polls', JSON.stringify(this.state.polls));
        if (this.state.currentUser) {
            localStorage.setItem('pm_user', JSON.stringify(this.state.currentUser));
        }
    },

    checkAuth: function() {
        const authEl = document.getElementById('auth-section');
        if (this.state.currentUser) {
            const firstLetter = this.state.currentUser.name.charAt(0).toUpperCase();
            authEl.innerHTML = `
                <div class="user-pill">
                    <div class="user-avatar">${firstLetter}</div>
                    <span class="user-name">${this.state.currentUser.name}</span>
                </div>`;
            
            // ถ้ามี User แล้วแต่ยังอยู่หน้า Login ให้ถีบไปหน้า Feed
            if (this.state.view === 'login') this.router('feed');
            else this.router(this.state.view);
        } else {
            authEl.innerHTML = '';
            // ถ้าไม่มี User ให้บังคับไปหน้า Login
            this.router('login');
        }
    },

    login: function(e) {
        e.preventDefault();
        const name = document.getElementById('username-input').value;
        if(name.trim()) {
            this.state.currentUser = { name: name, id: Date.now() };
            this.saveData();
            this.checkAuth();
        }
    },

    logout: function() {
        // --- Security Check ---
        if (!this.state.currentUser) {
            alert('กรุณาเข้าสู่ระบบก่อน');
            this.toggleMenu(false);
            return;
        }
        
        if(confirm('ต้องการออกจากระบบ?')) {
            localStorage.removeItem('pm_user');
            this.state.currentUser = null;
            this.toggleMenu(false);
            location.reload();
        }
    },

    router: function(viewName) {
        // --- Security Check (ด่านตรวจคนเข้าเมือง) ---
        // ถ้าจะไปหน้าอื่นที่ไม่ใช่ 'login' และยังไม่มี 'currentUser'
        if (viewName !== 'login' && !this.state.currentUser) {
            alert('กรุณาเข้าสู่ระบบก่อน');
            this.toggleMenu(false); // ปิดเมนู
            this.router('login');   // บังคับกลับมาหน้า Login (Recursive call แต่ปลอดภัยเพราะ viewName='login')
            return;                 // จบการทำงาน ไม่ให้รันบรรทัดล่างต่อ
        }

        // ซ่อนทุกหน้า
        document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
        
        // แสดงหน้าที่เลือก
        const target = document.getElementById(`view-${viewName}`);
        if(target) {
            target.classList.remove('hidden');
            target.classList.remove('fade-in'); 
            void target.offsetWidth; // Trigger Reflow for animation
            target.classList.add('fade-in');
        }

        this.state.view = viewName;
        this.toggleMenu(false); // ปิดเมนูเมื่อเปลี่ยนหน้าสำเร็จ

        if (viewName === 'feed') this.renderFeed();
        if (viewName === 'my-polls') this.renderFeed(true);
    },

    toggleMenu: function(force) {
        const menu = document.getElementById('side-menu');
        const overlay = document.querySelector('.overlay');
        const isActive = menu.classList.contains('active');
        const shouldActive = force !== undefined ? force : !isActive;

        if (shouldActive) {
            menu.classList.add('active');
            overlay.classList.add('active');
        } else {
            menu.classList.remove('active');
            overlay.classList.remove('active');
        }
    },

    toggleDarkMode: function() {
        // --- Security Check ---
        if (!this.state.currentUser) {
            alert('กรุณาเข้าสู่ระบบก่อน');
            this.toggleMenu(false);
            return;
        }

        document.body.classList.toggle('dark-mode');
        localStorage.setItem('pm_darkmode', document.body.classList.contains('dark-mode'));
        this.updateDarkModeUI();
    },

    updateDarkModeUI: function() {
        const isDark = document.body.classList.contains('dark-mode');
        const textEl = document.getElementById('dark-mode-text');
        const iconEl = document.getElementById('dark-mode-icon');
        
        if(textEl && iconEl) {
            textEl.textContent = isDark ? "โหมดสว่าง" : "โหมดกลางคืน";
            iconEl.textContent = isDark ? "light_mode" : "dark_mode";
        }
    },

    confirmExitCreate: function() {
        const hasInput = document.querySelector('input[name="question"]').value !== '';
        if (hasInput) {
            if(confirm('ยกเลิกการสร้างโพล? ข้อมูลจะหายไปนะ')) {
                document.querySelector('.create-form').reset();
                this.router('feed');
            }
        } else {
            this.router('feed');
        }
    },

    createPoll: function(e) {
        e.preventDefault();
        const form = e.target;
        const rawOptions = Array.from(form.querySelectorAll('.option-input'));
        const validOptions = rawOptions.filter(input => input.value.trim() !== '');

        if (validOptions.length < 2) return alert('ขออย่างน้อย 2 ตัวเลือกครับ');

        const newPoll = {
            id: Date.now(),
            question: form.question.value,
            category: form.category.value,
            options: validOptions.map((input, idx) => ({
                id: `opt_${Date.now()}_${idx}`,
                text: input.value,
                votes: 0
            })),
            createdBy: this.state.currentUser.name,
            voters: [],
            status: "active",
            timestamp: Date.now()
        };

        this.state.polls.unshift(newPoll);
        this.saveData();
        form.reset();
        document.getElementById('options-container').innerHTML = `
            <input type="text" class="modern-input option-input" placeholder="ตัวเลือกที่ 1" required>
            <input type="text" class="modern-input option-input" placeholder="ตัวเลือกที่ 2" required>
        `;
        this.router('feed');
    },

    addOptionInput: function() {
        const container = document.getElementById('options-container');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'modern-input option-input';
        input.placeholder = `ตัวเลือกที่ ${container.children.length + 1}`;
        input.required = true;
        input.style.opacity = '0';
        container.appendChild(input);
        setTimeout(() => input.style.opacity = '1', 50);
        input.focus();
    },

    vote: function(pollId, optionId) {
        const poll = this.state.polls.find(p => p.id === pollId);
        if (!poll || poll.status === 'ended') return;
        if (poll.voters.includes(this.state.currentUser.id)) return alert('คุณโหวตไปแล้ว');

        const opt = poll.options.find(o => o.id === optionId);
        opt.votes++;
        poll.voters.push(this.state.currentUser.id);

        this.saveData();
        this.renderFeed(this.state.view === 'my-polls');
    },

    endPoll: function(id) {
        if(confirm('ปิดโหวตเลยไหม?')) {
            const p = this.state.polls.find(x => x.id === id);
            p.status = 'ended';
            this.saveData();
            this.renderFeed(true);
        }
    },

    // --- ฟังก์ชันแชร์ (Web Share API) ---
    sharePoll: async function(pollId, event) {
        const poll = this.state.polls.find(p => p.id === pollId);
        if (!poll) return;

        // ข้อมูลที่จะแชร์
        const shareData = {
            title: 'PollMaster Vote',
            text: `มาช่วยโหวตโพลนี้หน่อย: "${poll.question}"`,
            url: window.location.href // ลิงก์เว็บปัจจุบัน
        };

        try {
            // ปุ่มที่ถูกกด (เพื่อใช้เปลี่ยนข้อความ)
            const btn = event.target.closest('button');
            const originalContent = btn.innerHTML;

            // 1. ลองใช้ระบบแชร์ของมือถือ (Native Share)
            if (navigator.share) {
                await navigator.share(shareData);
            } 
            // 2. ถ้าแชร์ไม่ได้ (เช่นบน PC) ให้ Copy Link แทน
            else {
                await navigator.clipboard.writeText(`${shareData.text} \nที่ลิงก์นี้: ${shareData.url}`);
                
                // เปลี่ยนปุ่มเป็นสีเขียวแจ้งเตือนว่า Copy แล้ว
                btn.innerHTML = `<span class="material-icons-round" style="font-size:16px;">check</span> คัดลอกแล้ว`;
                btn.style.color = 'var(--success)'; // สีเขียว
                
                // คืนค่าเดิมหลัง 2 วินาที
                setTimeout(() => {
                    btn.innerHTML = originalContent;
                    btn.style.color = '';
                }, 2000);
            }
        } catch (err) {
            console.log('User closed share menu or error:', err);
        }
    },

    setFilter: function(category) {
        this.state.currentFilter = category;
        this.renderFilterBadges();
        this.renderFeed();
    },

    renderFilterBadges: function() {
        const categories = [
            {id: 'all', label: 'ทั้งหมด'},
            {id: 'general', label: 'ทั่วไป'},
            {id: 'tech', label: 'เทคโนโลยี'},
            {id: 'food', label: 'อาหาร'},
            {id: 'travel', label: 'ท่องเที่ยว'},
            {id: 'love', label: 'ความรัก'}
        ];
        
        const container = document.getElementById('filter-badges');
        if(!container) return;

        container.innerHTML = categories.map(cat => `
            <div class="filter-badge ${this.state.currentFilter === cat.id ? 'active' : ''}" 
                 onclick="app.setFilter('${cat.id}')">
                ${cat.label}
            </div>
        `).join('');
    },

    renderFeed: function(showMyPolls = false) {
        const container = showMyPolls ? document.getElementById('my-polls-container') : document.getElementById('feed-container');
        container.innerHTML = '';

        let data = this.state.polls;
        
        if (showMyPolls) {
            data = data.filter(p => p.createdBy === this.state.currentUser.name);
        } else if (this.state.currentFilter !== 'all') {
            data = data.filter(p => p.category === this.state.currentFilter);
        }

        if (data.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding: 40px; color:var(--text-sub);">
                    <span class="material-icons-round" style="font-size: 48px; opacity:0.5;">inbox</span>
                    <p>ไม่มีรายการโพล</p>
                </div>`;
            return;
        }

        data.forEach(poll => {
            const hasVoted = poll.voters.includes(this.state.currentUser.id) || poll.status === 'ended';
            const totalVotes = poll.options.reduce((a, b) => a + b.votes, 0);
            
            const card = document.createElement('div');
            card.className = 'poll-card';

            let content = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                    <span style="font-size:0.75rem; font-weight:600; color:var(--primary); background:var(--primary-light); padding:4px 10px; border-radius:8px; text-transform: uppercase;">
                        ${poll.category}
                    </span>
                    ${poll.status === 'ended' ? '<span style="color:var(--danger); font-size:0.8rem; font-weight:bold;">ปิดแล้ว</span>' : ''}
                </div>
                <h3 style="margin-bottom:20px; font-size:1.2rem; line-height:1.4;">${poll.question}</h3>
            `;

            if (!hasVoted) {
                content += `<div class="options-list">`;
                poll.options.forEach(opt => {
                    content += `<button class="poll-option-btn" onclick="app.vote(${poll.id}, '${opt.id}')">
                        <span>${opt.text}</span>
                        <span class="material-icons-round" style="font-size:20px; opacity:0.5;">radio_button_unchecked</span>
                    </button>`;
                });
                content += `</div>`;
            } else {
                content += `<div class="results-list">`;
                const sorted = [...poll.options].sort((a,b) => b.votes - a.votes);
                const maxVote = sorted[0].votes;

                poll.options.forEach(opt => {
                    const pct = totalVotes === 0 ? 0 : ((opt.votes/totalVotes)*100).toFixed(1);
                    const isWinner = opt.votes === maxVote && totalVotes > 0;
                    
                    content += `
                        <div class="result-item">
                            <div class="result-info">
                                <span style="${isWinner ? 'font-weight:600; color:var(--primary);' : ''}">${opt.text} ${isWinner ? '👑' : ''}</span>
                                <span>${pct}%</span>
                            </div>
                            <div class="progress-bg">
                                <div class="progress-fill" style="width:${pct}%; ${isWinner ? '' : 'opacity:0.6; filter:grayscale(0.5);'}"></div>
                            </div>
                        </div>
                    `;
                });
                content += `</div>`;
            }

            content += `
                <div style="margin-top:20px; padding-top:16px; border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.85rem; color:var(--text-sub);">โดย ${poll.createdBy} • ${totalVotes} โหวต</span>
                    ${showMyPolls ? 
                        `<button onclick="app.endPoll(${poll.id})" class="btn-danger-soft">ยุติการโหวต</button>` : 
                        // แทนที่บรรทัดเดิมด้วยบรรทัดนี้ครับ
                     `<button onclick="app.sharePoll(${poll.id}, event)" class="btn-text" style="font-size:0.85rem; display:flex; align-items:center; gap:4px;"><span class="material-icons-round" style="font-size:16px;">share</span> แชร์</button>`
                    }
                </div>
            `;

            card.innerHTML = content;
            container.appendChild(card);
        });
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());