"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'th';

type Translations = {
    [key in Language]: {
        [key: string]: string;
    };
};

const translations: Translations = {
    en: {
        loginTitle: 'Welcome Back',
        loginSubtitle: 'Sign in to your account',
        usernameLabel: 'Username / Employee ID',
        usernamePlaceholder: 'Enter your Employee ID (e.g., EMP-101)',
        passwordLabel: 'Password',
        passwordPlaceholder: 'Enter your secure password',
        loginButton: 'Sign In',
        loggingIn: 'Logging in...',
        welcome: 'Welcome',
        errorLogin: 'Failed to login',
        errorOccurred: 'An error occurred',
        toggleTheme: 'Toggle theme',
        language: 'Language',
    },
    th: {
        loginTitle: 'ยินดีต้อนรับกลับ',
        loginSubtitle: 'ลงชื่อเข้าใช้บัญชีของคุณ',
        usernameLabel: 'ชื่อผู้ใช้ / รหัสพนักงาน',
        usernamePlaceholder: 'กรอกรหัสพนักงาน (เช่น EMP-101)',
        passwordLabel: 'รหัสผ่าน',
        passwordPlaceholder: 'กรอกรหัสผ่านของคุณ',
        loginButton: 'เข้าสู่ระบบ',
        loggingIn: 'กำลังเข้าสู่ระบบ...',
        welcome: 'ยินดีต้อนรับ',
        errorLogin: 'เข้าสู่ระบบไม่สำเร็จ',
        errorOccurred: 'เกิดข้อผิดพลาด',
        toggleTheme: 'เปลี่ยนธีม',
        language: 'ภาษา',
    },
};

type I18nContextType = {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');

    const t = (key: string) => {
        return translations[language][key] || key;
    };

    return (
        <I18nContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (context === undefined) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
}
