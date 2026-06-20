# pi-openmodel-provider

Extensión de pi para OpenModel.ai - Un gateway multi-modelo que te da acceso a 40+ modelos de IA.

## Instalación

```bash
pi install git:github.com/IvanGabrielYarupaitanRivera/pi-openmodel-provider
```

## Uso

### 1️⃣ Autenticación (una sola vez)

```
/login openmodel
```

Te mostrará dos opciones:
- 🌐 **Abrir consola en navegador** → te lleva a console.openmodel.ai
- 📋 **Pegar API key manualmente**

Tu API key se guarda automáticamente en pi.

### 2️⃣ Usar modelos

```
pi --model openmodel/deepseek-v4-flash
```

## Modelos disponibles

| Proveedor | Modelos |
|-----------|---------|
| OpenAI | GPT-5.x family |
| Anthropic | Claude Opus/Sonnet/Haiku |
| Google Gemini | Gemini Flash/Pro |
| DeepSeek | DeepSeek V4 (1M contexto) |
| Alibaba Qwen | Qwen3.x family |
| Xiaomi (MiMo) | Mimo v2.x |
| Moonshot (Kimi) | Kimi K2.x |
| MiniMax | MiniMax M2.x/M3 |
| ZAI (GLM) | GLM-4.x/5.x |

## Comandos útiles

```
/openmodel                # Ver estado de la extensión
/openmodel-stability      # Ver salud de todos los modelos
/openmodel-stability <model>  # Ver métricas de un modelo
```

## Características

- ✅ **42 modelos** dinámicos (se actualizan automáticamente)
- ✅ **3 protocolos**: Messages (Anthropic), Responses (OpenAI), Gemini (Google)
- ✅ **Estabilidad en tiempo real** con health status
- ✅ **1M contexto** para DeepSeek V4 Flash
- ✅ **Sin hardcodeo** - nuevos modelos aparecen solos

## Configuración alternativa

Si prefieres usar variable de entorno:

```bash
export OPENMODEL_API_KEY="om-tu-api-key"
```

## ¿Qué es OpenModel?

[OpenModel.ai](https://www.openmodel.ai/) es un gateway multi-modelo que te da acceso a múltiples proveedores de IA con una sola API key. Gestionas el tráfico de producción, tienes analíticas y puedes cambiar entre modelos fácilmente.

---

**Hecho con ❤️ para la comunidad pi**