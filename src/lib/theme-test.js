// Test del sistema de temas
// Para probar desde la consola del navegador:

// Función para alternar entre temas
window.testTheme = {
    // Obtener el tema actual
    getCurrentTheme() {
        return localStorage.getItem('finanzas-ui-theme') || 'system';
    },

    // Cambiar a tema claro
    setLight() {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        localStorage.setItem('finanzas-ui-theme', 'light');
        console.log('✅ Tema cambiado a claro');
    },

    // Cambiar a tema oscuro
    setDark() {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        localStorage.setItem('finanzas-ui-theme', 'dark');
        console.log('🌙 Tema cambiado a oscuro');
    },

    // Usar tema del sistema
    setSystem() {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(isDark ? 'dark' : 'light');
        localStorage.setItem('finanzas-ui-theme', 'system');
        console.log('🖥️ Tema cambiado a sistema:', isDark ? 'oscuro' : 'claro');
    },

    // Alternar entre claro/oscuro
    toggle() {
        const currentTheme = this.getCurrentTheme();
        if (currentTheme === 'dark') {
            this.setLight();
        } else {
            this.setDark();
        }
    },

    // Mostrar estado actual
    status() {
        const theme = this.getCurrentTheme();
        const isDark = document.documentElement.classList.contains('dark');
        console.log('📊 Estado del tema:');
        console.log('- Configurado:', theme);
        console.log('- Aplicado:', isDark ? 'oscuro' : 'claro');
        console.log('- Sistema prefiere:', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro');
    }
};

console.log('🎨 Sistema de temas cargado. Usa window.testTheme para probar:');
console.log('- testTheme.setLight() // Tema claro');
console.log('- testTheme.setDark() // Tema oscuro');
console.log('- testTheme.setSystem() // Tema del sistema');
console.log('- testTheme.toggle() // Alternar');
console.log('- testTheme.status() // Ver estado actual');