COLORLAB · CATÁLOGO CROMÁTICO ACTUALIZADO

1) Instalación nueva:
   importar database/pinturas_catalogo.sql

2) Si ya tenés los 1.176 colores cargados:
   hacer backup y ejecutar database/migracion_catalogo_nombres.sql

La migración conserva los IDs y HEX/RGB/fila/columna, y actualiza los códigos y nombres ColorLab.
Campos nuevos: familia_color, temperatura, nivel_saturacion, nivel_luminosidad,
clasificacion_cromatica, aplica_latex, aplica_sintetico, aplica_barniz_tinte.

Los nombres/códigos son nomenclatura propia de ColorLab, no códigos oficiales de fabricantes.
Barniz/Tinte se marca sólo como compatibilidad de referencia; el resultado real en madera depende del soporte y manos.
