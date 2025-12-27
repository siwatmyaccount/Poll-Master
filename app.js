const app = {
    state: {
        currentUser: null,
        polls: [],
        view: 'feed',
        currentFilter: 'all',
        searchTerm: '',
        currentSort: 'newest'
    },

    init: function() {
        this.loadData();
        this.checkAuth();
        this.renderFilterBadges();
        this.updateDarkModeUI();
        setInterval(() => {
            if (this.state.view === 'feed' || this.state.view === 'my-polls') {
                this.renderFeed(this.state.view === 'my-polls');
            }
        }, 60000);
    },

    // --- Helpers ---
    showToast: function(title, message, type = 'normal') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        let icon = 'info';
        if(type === 'success') icon = 'check_circle';
        if(type === 'error') icon = 'error';
        toast.innerHTML = `
            <span class="material-icons-round toast-icon">${icon}</span>
            <div class="toast-content">
                <span class="toast-title">${title}</span>
                <span class="toast-msg">${message}</span>
            </div>
        `;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s forwards';
            toast.addEventListener('animationend', () => toast.remove());
        }, 3000);
    },

    getRemainingTime: function(deadline) {
        if (!deadline) return null;
        const now = Date.now();
        const diff = deadline - now;
        if (diff <= 0) return 'ended';
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (days > 365) return `> 1 ปี`;
        if (days > 30) return `${Math.floor(days/30)} เดือน`;
        if (days > 0) return `${days} วัน ${hours} ชม.`;
        if (hours > 0) return `${hours} ชม. ${minutes} นาที`;
        return `${minutes} นาที`;
    },

    timeAgo: function(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " ปีที่แล้ว";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " เดือนที่แล้ว";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " วันที่แล้ว";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " ชม.ที่แล้ว";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " นาทีที่แล้ว";
        return "เมื่อสักครู่";
    },

    toggleDurationInput: function(checkbox) {
        const wrapper = document.getElementById('duration-wrapper');
        if (checkbox.checked) {
            wrapper.classList.add('disabled');
        } else {
            wrapper.classList.remove('disabled');
            document.getElementById('duration-val').focus();
        }
    },

    // --- Core Data ---
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
                deadline: Date.now() + 86400000,
                options: [
                    { id: 'o1', text: "ทะเล", votes: 5 },
                    { id: 'o2', text: "ภูเขา", votes: 12 },
                    { id: 'o3', text: "นอนอยู่บ้าน", votes: 21 }
                ],
                comments: [ // เพิ่มโครงสร้าง comments
                    { user: "Admin", text: "แนะนำภูเขา ช่วงนี้อากาศดี", time: Date.now() - 3600000 }
                ],
                createdBy: "Admin",
                voters: [],
                status: "active",
                timestamp: Date.now()
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

    // --- Auth & Routing ---
    checkAuth: function() {
        const authEl = document.getElementById('auth-section');
        if (this.state.currentUser) {
            const firstLetter = this.state.currentUser.name.charAt(0).toUpperCase();
            authEl.innerHTML = `
                <div class="user-pill">
                    <div class="user-avatar">${firstLetter}</div>
                    <span class="user-name">${this.state.currentUser.name}</span>
                </div>`;
            if (this.state.view === 'login') this.router('feed');
            else this.router(this.state.view);
        } else {
            authEl.innerHTML = '';
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
            this.showToast('ยินดีต้อนรับ', `สวัสดีคุณ ${name}`, 'success');
        }
    },

    logout: function() {
        if (!this.state.currentUser) {
            this.showToast('แจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อน', 'error');
            this.toggleMenu(false); return;
        }
        if(confirm('ต้องการออกจากระบบ?')) {
            localStorage.removeItem('pm_user');
            this.state.currentUser = null;
            this.toggleMenu(false);
            location.reload();
        }
    },

    router: function(viewName) {
        if (viewName !== 'login' && !this.state.currentUser) {
            this.showToast('Access Denied', 'กรุณาเข้าสู่ระบบเพื่อใช้งาน', 'error');
            this.toggleMenu(false); this.router('login'); return;
        }
        document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
        const target = document.getElementById(`view-${viewName}`);
        if(target) {
            target.classList.remove('hidden');
            target.classList.remove('fade-in'); 
            void target.offsetWidth; target.classList.add('fade-in');
        }
        this.state.view = viewName;
        this.toggleMenu(false);
        if (viewName === 'feed' || viewName === 'my-polls') {
            this.state.searchTerm = '';
            const searchInput = document.querySelector('.search-input');
            if(searchInput) searchInput.value = '';
            this.renderFeed(viewName === 'my-polls');
        }
    },

    toggleMenu: function(force) {
        const menu = document.getElementById('side-menu');
        const overlay = document.querySelector('.overlay');
        const isActive = menu.classList.contains('active');
        const shouldActive = force !== undefined ? force : !isActive;
        if (shouldActive) { menu.classList.add('active'); overlay.classList.add('active'); } 
        else { menu.classList.remove('active'); overlay.classList.remove('active'); }
    },

    toggleDarkMode: function() {
        if (!this.state.currentUser) {
            this.showToast('แจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อน', 'error');
            this.toggleMenu(false); return;
        }
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('pm_darkmode', document.body.classList.contains('dark-mode'));
        this.updateDarkModeUI();
        const mode = document.body.classList.contains('dark-mode') ? 'โหมดกลางคืน' : 'โหมดสว่าง';
        this.showToast('เปลี่ยนธีม', `ใช้งาน ${mode} แล้ว`, 'success');
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

    // --- Poll Actions ---
    confirmExitCreate: function() {
        const hasInput = document.querySelector('input[name="question"]').value !== '';
        if (hasInput) {
            if(confirm('ยกเลิกการสร้างโพล? ข้อมูลจะหายไปนะ')) {
                document.querySelector('.create-form').reset();
                this.router('feed');
            }
        } else { this.router('feed'); }
    },

    createPoll: function(e) {
        e.preventDefault();
        const form = e.target;
        const rawOptions = Array.from(form.querySelectorAll('.option-input'));
        const validOptions = rawOptions.filter(input => input.value.trim() !== '');

        if (validOptions.length < 2) {
            this.showToast('ข้อมูลไม่ครบ', 'ต้องมีอย่างน้อย 2 ตัวเลือกครับ', 'error'); return;
        }

        let deadline = null;
        const isForever = document.getElementById('forever-checkbox').checked;
        if (!isForever) {
            const val = parseInt(document.getElementById('duration-val').value) || 0;
            const unit = document.getElementById('duration-unit').value;
            if (val <= 0) { this.showToast('เวลาไม่ถูกต้อง', 'กรุณาระบุเวลาให้ถูกต้อง', 'error'); return; }
            let ms = 0;
            switch(unit) {
                case 'min': ms = val * 60 * 1000; break;
                case 'hour': ms = val * 60 * 60 * 1000; break;
                case 'day': ms = val * 24 * 60 * 60 * 1000; break;
                case 'month': ms = val * 30 * 24 * 60 * 60 * 1000; break;
                case 'year': ms = val * 365 * 24 * 60 * 60 * 1000; break;
            }
            deadline = Date.now() + ms;
        }

        const newPoll = {
            id: Date.now(),
            question: form.question.value,
            category: form.category.value,
            deadline: deadline,
            options: validOptions.map((input, idx) => ({
                id: `opt_${Date.now()}_${idx}`,
                text: input.value,
                votes: 0
            })),
            comments: [], // เริ่มต้นไม่มีคอมเมนต์
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
        document.getElementById('forever-checkbox').checked = false;
        app.toggleDurationInput(document.getElementById('forever-checkbox'));
        this.showToast('สำเร็จ', 'สร้างโพลใหม่เรียบร้อยแล้ว', 'success');
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
        if (poll.deadline && Date.now() > poll.deadline) {
            poll.status = 'ended'; this.saveData(); this.renderFeed();
            this.showToast('เสียใจด้วย', 'โพลนี้หมดเวลาโหวตแล้ว', 'error'); return;
        }
        if (!poll || poll.status === 'ended') {
            this.showToast('ไม่สำเร็จ', 'โพลนี้ปิดไปแล้ว', 'error'); return;
        }
        if (poll.voters.includes(this.state.currentUser.id)) {
            this.showToast('แจ้งเตือน', 'คุณโหวตโพลนี้ไปแล้ว', 'error'); return;
        }
        const opt = poll.options.find(o => o.id === optionId);
        opt.votes++;
        poll.voters.push(this.state.currentUser.id);
        this.saveData();
        this.showToast('โหวตสำเร็จ', `คุณเลือก "${opt.text}"`, 'success');
        this.renderFeed(this.state.view === 'my-polls');
    },

    endPoll: function(id) {
        if(confirm('ยืนยันปิดโหวต?')) {
            const p = this.state.polls.find(x => x.id === id);
            p.status = 'ended'; this.saveData();
            this.showToast('เรียบร้อย', 'ปิดรับคะแนนโหวตแล้ว', 'success');
            this.renderFeed(true);
        }
    },

    sharePoll: async function(pollId, event) {
        const poll = this.state.polls.find(p => p.id === pollId);
        if (!poll) return;
        const shareData = {
            title: 'PollMaster Vote',
            text: `มาช่วยโหวตโพลนี้หน่อย: "${poll.question}"`,
            url: window.location.href 
        };
        try {
            if (navigator.share) { await navigator.share(shareData); } 
            else {
                await navigator.clipboard.writeText(`${shareData.text} \nที่ลิงก์นี้: ${shareData.url}`);
                this.showToast('คัดลอกแล้ว', 'นำลิงก์ไปวางส่งให้เพื่อนได้เลย', 'success');
            }
        } catch (err) { console.log(err); }
    },

    // --- Comment System Logic ---
    toggleComments: function(pollId) {
        const section = document.getElementById(`comments-${pollId}`);
        if(section.classList.contains('active')) {
            section.classList.remove('active');
        } else {
            section.classList.add('active');
        }
    },

    submitComment: function(pollId) {
        const input = document.getElementById(`input-comment-${pollId}`);
        const text = input.value.trim();
        
        if(!text) return;

        const poll = this.state.polls.find(p => p.id === pollId);
        if(!poll.comments) poll.comments = []; // กันเหนียว

        poll.comments.push({
            user: this.state.currentUser.name,
            text: text,
            time: Date.now()
        });

        this.saveData();
        input.value = ''; // เคลียร์ช่อง
        this.showToast('ส่งความคิดเห็น', 'บันทึกคอมเมนต์แล้ว', 'success');
        
        // Re-render เฉพาะส่วนคอมเมนต์ (แบบบ้านๆ คือ re-render ทั้ง feed แต่เพื่อให้ง่ายต่อโค้ด)
        this.renderFeed(this.state.view === 'my-polls');
        
        // เปิดคอมเมนต์ค้างไว้
        setTimeout(() => {
            const section = document.getElementById(`comments-${pollId}`);
            if(section) section.classList.add('active');
        }, 50);
    },

    deleteComment: function(pollId, commentTime) {
        if(!confirm('ต้องการลบความคิดเห็นนี้ใช่ไหม?')) return;
        
        const poll = this.state.polls.find(p => p.id === pollId);
        if(poll) {
            // กรองเอาคอมเมนต์ที่มีเวลาไม่ตรงกับ timestamp นี้เก็บไว้ (คือลบตัวที่ตรงทิ้ง)
            poll.comments = poll.comments.filter(c => c.time !== commentTime);
            
            this.saveData();
            this.renderFeed(this.state.view === 'my-polls');
            this.showToast('สำเร็จ', 'ลบความคิดเห็นเรียบร้อย', 'success');
            
            // สั่งให้เปิดส่วนคอมเมนต์ค้างไว้ (ไม่งั้นมันจะหุบ)
            setTimeout(() => {
                const section = document.getElementById(`comments-${pollId}`);
                if(section) section.classList.add('active');
            }, 50);
        }
    },

    setFilter: function(category) {
        this.state.currentFilter = category;
        this.renderFilterBadges();
        this.renderFeed();
    },

    handleSearch: function(e) {
        this.state.searchTerm = e.target.value.toLowerCase().trim();
        this.renderFeed(this.state.view === 'my-polls');
    },

    handleSort: function(e) {
        this.state.currentSort = e.target.value;
        this.renderFeed(this.state.view === 'my-polls');
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
        // ประกาศตัวแปรทั้ง 2 กล่อง
        const feedContainer = document.getElementById('feed-container');
        const myPollsContainer = document.getElementById('my-polls-container');

        // เลือกกล่องที่จะใช้งาน
        const container = showMyPolls ? myPollsContainer : feedContainer;

        // --- แก้ไข: ล้างข้อมูลทั้ง 2 กล่องเพื่อไม่ให้ ID ชนกัน ---
        feedContainer.innerHTML = '';
        myPollsContainer.innerHTML = '';
        // ----------------------------------------------------

        // โค้ดส่วนดึงข้อมูล (เหมือนเดิม)
        let data = this.state.polls;
        if (showMyPolls) data = data.filter(p => p.createdBy === this.state.currentUser.name);
        else if (this.state.currentFilter !== 'all') data = data.filter(p => p.category === this.state.currentFilter);

        // --- เริ่มส่วน Logic การเรียงลำดับ (Sorting) ---
        data.sort((a, b) => {
            const now = Date.now();
            switch(this.state.currentSort) {
                case 'popular':
                    // เรียงตามจำนวนคนโหวต (มาก -> น้อย)
                    return b.voters.length - a.voters.length;
                
                case 'ending':
                    // เรียงตามเวลาที่เหลือ (น้อย -> มาก) เฉพาะที่ยังไม่จบ
                    // ถ้าจบแล้วเอาไปไว้ท้ายสุด
                    if (a.status === 'ended' && b.status !== 'ended') return 1;
                    if (a.status !== 'ended' && b.status === 'ended') return -1;
                    if (!a.deadline) return 1; // ไม่มีวันหมดอายุเอาไว้ท้าย
                    if (!b.deadline) return -1;
                    return (a.deadline - now) - (b.deadline - now);

                case 'oldest':
                    return a.timestamp - b.timestamp;

                case 'newest':
                default:
                    return b.timestamp - a.timestamp;
            }
        });
        // --- จบส่วน Logic การเรียงลำดับ ---

        // ... (ต่อด้วย if (data.length === 0) ของเดิม ...)
        if (data.length === 0) {
            const emptyMsg = this.state.searchTerm ? `ไม่พบโพลที่เกี่ยวกับ "${this.state.searchTerm}"` : 'ไม่มีรายการโพล';
            container.innerHTML = `
                <div style="text-align:center; padding: 40px; color:var(--text-sub);">
                    <span class="material-icons-round" style="font-size: 48px; opacity:0.5;">search_off</span>
                    <p>${emptyMsg}</p>
                </div>`;
            return;
        }

        data.forEach(poll => {
            // Auto Close Check
            if (poll.deadline && Date.now() > poll.deadline && poll.status === 'active') { poll.status = 'ended'; }

            const hasVoted = poll.voters.includes(this.state.currentUser.id) || poll.status === 'ended';
            const totalVotes = poll.options.reduce((a, b) => a + b.votes, 0);
            const remaining = this.getRemainingTime(poll.deadline);
            
            // Comment Count
            const comments = poll.comments || [];
            const commentCount = comments.length;

            let timeBadge = '';
            if (poll.status === 'active') {
                if (!remaining) timeBadge = `<span class="poll-time-badge"><span class="material-icons-round" style="font-size:12px;">all_inclusive</span> ไม่จำกัดเวลา</span>`;
                else timeBadge = `<span class="poll-time-badge ${remaining.includes('นาที') || remaining.includes('ชม.') ? 'urgent' : ''}"><span class="material-icons-round" style="font-size:12px;">timer</span> เหลือ ${remaining}</span>`;
            }

            const card = document.createElement('div');
            card.className = 'poll-card';
            
            let content = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.75rem; font-weight:600; color:var(--primary); background:var(--primary-light); padding:4px 10px; border-radius:8px; text-transform: uppercase;">
                        ${poll.category}
                    </span>
                    ${poll.status === 'ended' ? '<span style="color:var(--danger); font-size:0.8rem; font-weight:bold;">ปิดแล้ว</span>' : timeBadge}
                </div>
                <h3 style="margin-top:12px; margin-bottom:20px; font-size:1.2rem; line-height:1.4;">${poll.question}</h3>
            `;

            if (!hasVoted) {
                // ... (ส่วนแสดงปุ่มโหวต เดิมๆ ไม่ต้องแก้) ...
                content += `<div class="options-list">`;
                poll.options.forEach(opt => {
                    content += `<button class="poll-option-btn" onclick="app.vote(${poll.id}, '${opt.id}')">
                        <span>${opt.text}</span>
                        <span class="material-icons-round" style="font-size:20px; opacity:0.5;">radio_button_unchecked</span>
                    </button>`;
                });
                content += `</div>`;
            } else {
                // --- แก้ไขตรงนี้ (ส่วนแสดงผลลัพธ์) ---
                content += `<div class="results-list">`;
                // เรียงลำดับคะแนน
                const sorted = [...poll.options].sort((a,b) => b.votes - a.votes);
                const maxVote = sorted[0].votes;
                
                poll.options.forEach(opt => {
                    // คำนวณเปอร์เซ็นต์
                    const pct = totalVotes === 0 ? 0 : ((opt.votes/totalVotes)*100).toFixed(1);
                    const isWinner = opt.votes === maxVote && totalVotes > 0;
                    
                    // แสดงบาร์คะแนน (Progress Bar) แทนปุ่มคอมเมนต์ที่ซ้ำ
                    content += `
                        <div class="result-item">
                            <div class="result-info">
                                <span style="${isWinner ? 'font-weight:bold; color:var(--primary);' : ''}">
                                    ${opt.text} ${isWinner ? '🏆' : ''}
                                </span>
                                <span style="font-size:0.9rem; color:var(--text-sub);">
                                    ${pct}% (${opt.votes})
                                </span>
                            </div>
                            <div class="progress-bg">
                                <div class="progress-fill" style="width: ${pct}%; ${isWinner ? 'background:var(--primary);' : 'background:#ccc;'}"></div>
                            </div>
                        </div>
                    `;
                });
                content += `</div>`;
            }

            // Footer Actions (Vote count + Share + Comment Toggle)
            content += `
                <div style="margin-top:20px; padding-top:16px; border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; gap:12px; align-items:center;">
                        <span style="font-size:0.85rem; color:var(--text-sub);">โดย ${poll.createdBy} • ${totalVotes} โหวต</span>
                    </div>
                    
                   <div style="display:flex; gap:10px;">
                        <button class="comment-btn" onclick="app.toggleComments(${poll.id})">
                            <span class="material-icons-round" style="font-size:18px;">chat_bubble_outline</span>
                            <span>Comments (${commentCount})</span>
                        </button>
                        
                        ${showMyPolls ? 
                            `<button onclick="app.endPoll(${poll.id})" class="btn-danger-soft">ยุติ</button>` : 
                            `<button onclick="app.sharePoll(${poll.id}, event)" class="btn-text" style="font-size:0.85rem; display:flex; align-items:center; gap:4px;"><span class="material-icons-round" style="font-size:16px;">share</span> แชร์</button>`
                        }
                    </div>
                </div>

                <div id="comments-${poll.id}" class="comment-section">
                    <div class="comment-input-wrapper">
                        <input type="text" id="input-comment-${poll.id}" class="comment-input" placeholder="แสดงความคิดเห็น...">
                        <button class="btn-send" onclick="app.submitComment(${poll.id})">
                            <span class="material-icons-round" style="font-size:18px;">send</span>
                        </button>
                    </div>
                    
                    <div class="comment-list">
                        ${comments.length === 0 ? '<p style="font-size:0.8rem; color:var(--text-sub); text-align:center;">ยังไม่มีความคิดเห็น เป็นคนแรกเลย!</p>' : ''}
                        ${comments.slice().reverse().map(c => {
                            // เช็คว่าเป็นเจ้าของคอมเมนต์หรือไม่?
                            const isOwner = c.user === this.state.currentUser.name;
                            
                            return `
                            <div class="comment-item">
                                <div class="comment-avatar">${c.user.charAt(0).toUpperCase()}</div>
                                <div style="flex:1;">
                                    <div class="comment-meta">
                                        <span class="comment-user">${c.user}</span>
                                        <div style="display:flex; align-items:center;">
                                            <span class="comment-time">${app.timeAgo(c.time)}</span>
                                            
                                            ${isOwner ? `
                                                <button class="btn-delete-comment" onclick="app.deleteComment(${poll.id}, ${c.time})" title="ลบความเห็น">
                                                    <span class="material-icons-round">delete_outline</span>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                    <div class="comment-bubble">${c.text}</div>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
            card.innerHTML = content;
            container.appendChild(card);
        });
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());