COLORLAB - PRESUPUESTO FORMAL DINAMICO

Cambios incluidos:
- Los datos personales del documento de referencia NO se incorporan al código.
- Prestador: Nombre, CUIT, Domicilio y Teléfono comienzan vacíos.
- Destinatario: Edificio, Dirección y Localidad comienzan vacíos.
- Los campos se reflejan en tiempo real en window.FormalBudgetForm.
- Prestador y destinatario se conservan en localStorage.
- Cambiar o cargar un modelo CSV NO borra esos datos.
- Botón "Limpiar modelo de obra": limpia solo el modelo.
- Botón "Limpiar prestador y destinatario": limpia solo esas partes y su persistencia.
- El CSV admite delimitador ; o , y encabezados equivalentes.
- Se incluye modelos_presupuesto_template.csv con los encabezados esperados.

Encabezados recomendados:
modelo;descripcion;volquetes;andamios;materiales;total

La capa está en:
modules/formal_budget/formal-budget.js
modules/formal_budget/formal-budget.css

La monetización permanece desacoplada y sin cambios funcionales.
