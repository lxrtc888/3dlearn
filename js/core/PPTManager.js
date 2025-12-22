/**
 * PPT管理器
 * 负责幻灯片的渲染和翻页控制
 */
import { slides } from '../data/slides.js';

export class PPTManager {
    constructor(container) {
        this.container = container;
        this.currentIndex = 0;
        this.slides = slides;
        
        this.btnPrev = null;
        this.btnNext = null;
        this.slideNum = null;
    }
    
    /**
     * 初始化PPT控制
     */
    init() {
        // 获取控制按钮
        this.btnPrev = document.getElementById('btn-prev');
        this.btnNext = document.getElementById('btn-next');
        this.slideNum = document.getElementById('slide-num');
        
        // 绑定事件
        if (this.btnPrev) {
            this.btnPrev.addEventListener('click', () => this.prevSlide());
        }
        if (this.btnNext) {
            this.btnNext.addEventListener('click', () => this.nextSlide());
        }
        
        // 键盘导航
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.prevSlide();
            if (e.key === 'ArrowRight') this.nextSlide();
        });
    }
    
    /**
     * 渲染幻灯片
     * @param {number} index - 幻灯片索引
     */
    renderSlide(index) {
        if (index < 0 || index >= this.slides.length) return;
        
        this.currentIndex = index;
        const slide = this.slides[index];
        
        this.container.innerHTML = `
            <div class="slide-content h-full">
                <div class="slide-header">
                    <div class="slide-title">${slide.title}</div>
                    <div class="slide-subtitle">${slide.subtitle}</div>
                </div>
                <div class="slide-body">${slide.content}</div>
            </div>
        `;
        
        // 更新页码
        if (this.slideNum) {
            this.slideNum.innerText = `${index + 1} / ${this.slides.length}`;
        }
        
        // 更新按钮状态
        if (this.btnPrev) {
            this.btnPrev.disabled = index === 0;
        }
        if (this.btnNext) {
            this.btnNext.disabled = index === this.slides.length - 1;
        }
    }
    
    /**
     * 下一页
     */
    nextSlide() {
        if (this.currentIndex < this.slides.length - 1) {
            this.renderSlide(this.currentIndex + 1);
        }
    }
    
    /**
     * 上一页
     */
    prevSlide() {
        if (this.currentIndex > 0) {
            this.renderSlide(this.currentIndex - 1);
        }
    }
    
    /**
     * 跳转到指定页
     * @param {number} index - 目标页索引
     */
    goToSlide(index) {
        this.renderSlide(index);
    }
    
    /**
     * 重置到第一页
     */
    reset() {
        this.renderSlide(0);
    }
}

