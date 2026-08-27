export const LOCALE = "ru-RU";

const FIELD_LABELS: Record<string, string> = {
  email: "Электронная почта",
  password: "Пароль",
  sku: "Артикул",
  name: "Название",
  weight: "Вес",
  firstName: "Имя",
  lastName: "Фамилия",
  phone: "Телефон",
  goldTone: "Цвет золота",
  metalCategory: "Металл",
  itemCategory: "Категория",
  supplierId: "Поставщик",
  locationId: "Точка",
  price: "Цена",
  costPrice: "Себестоимость",
  role: "Роль",
  status: "Статус",
  newPassword: "Новый пароль",
  token: "Токен",
};

const MESSAGES: Record<string, string> = {
  "Invalid credentials": "Неверный email или пароль",
  "Authentication required": "Нужно войти в систему",
  "Insufficient permissions": "Недостаточно прав для этого действия",
  "Email already registered": "Такой email уже зарегистрирован",
  "Invalid refresh token": "Сессия истекла. Войдите снова",
  "Refresh token revoked": "Сессия отозвана. Войдите снова",
  "Invalid or expired reset token": "Код сброса недействителен или устарел",
  "If the email exists, a reset code was sent":
    "Если такой email есть в системе, код сброса отправлен",
  "2FA is temporarily disabled": "Двухфакторная защита сейчас выключена",
  "2FA is required for this role": "Для этой роли нужна двухфакторная защита",
  "Invalid or expired 2FA challenge": "Код подтверждения недействителен или устарел",
  "Invalid 2FA setup challenge": "Не удалось подтвердить настройку 2FA",
  "Invalid TOTP code": "Неверный код из приложения",
  "User not found": "Сотрудник не найден",
  "Cannot delete your own account": "Нельзя удалить свой аккаунт",
  "Cannot remove the last admin": "Нельзя убрать последнего администратора",
  "Cannot delete a user with sales, shifts or stock checks. Block the account instead.":
    "Нельзя удалить сотрудника с продажами, сменами или инвентаризациями. Заблокируйте аккаунт",
  "Product not found": "Товар не найден",
  "SKU already exists": "Такой артикул уже существует",
  "Could not allocate a product article": "Не удалось выдать артикул",
  "Cannot delete a product that has inventory items":
    "Нельзя удалить товар, пока есть физические единицы. Сначала уберите их со склада",
  "Cannot delete a product that has sales":
    "Нельзя удалить товар: по нему уже были продажи",
  "Supplier not found": "Поставщик не найден",
  "Supplier with this name already exists": "Поставщик с таким названием уже есть",
  "Cannot delete a supplier with products or batches. Deactivate instead.":
    "Нельзя удалить поставщика, пока у него есть товар на складе",
  "Cannot delete a supplier while their goods are in stock":
    "Нельзя удалить поставщика, пока у него есть товар на складе",
  "Cannot delete a supplier with products that have sales. Deactivate instead.":
    "Нельзя удалить поставщика: по его товарам уже были продажи. Сделайте его неактивным",
  "goldTone is required for gold products": "Для золота нужно выбрать цвет",
  "goldTone is only allowed for gold products": "Цвет золота можно указать только для золотых изделий",
  "Location not found": "Точка не найдена",
  "Warehouse location is not configured": "Складская точка не настроена",
  "Access to this sales location is denied": "Нет доступа к этой точке продаж",
  "Location scope required": "Нужно указать точку продаж",
  "Cannot set a location as a child of itself or its descendant":
    "Нельзя сделать точку дочерней самой себе",
  "Cannot delete a location that has children, staff, items, sales or shifts":
    "Нельзя удалить точку, пока к ней привязаны сотрудники, товары, продажи или смены",
  "Only an admin can change their sales location":
    "Точку продаж может менять только администратор",
  "Shift not found": "Смена не найдена",
  "No open shift": "Нет открытой смены",
  "locationId is required to open a shift": "Чтобы открыть смену, нужна точка продаж",
  "Cashier already has an open shift; close it first":
    "У кассира уже есть открытая смена. Сначала закройте её",
  "Cannot close another cashier's shift": "Нельзя закрыть чужую смену",
  "Shift is already closed": "Смена уже закрыта",
  "Cannot close a shift with unpaid draft receipts":
    "Нельзя закрыть смену, пока есть неоплаченные черновики чеков",
  "Open a shift before creating a receipt": "Сначала откройте смену",
  "Shift is closed": "Смена закрыта",
  "Cannot pay an empty receipt": "Нельзя оплатить пустой чек",
  "Receipt total must be positive": "Сумма чека должна быть больше нуля",
  "Sale not found": "Чек не найден",
  "Only a paid receipt can be refunded": "Сторнировать можно только оплаченный чек",
  "Cannot refund after the shift is closed": "Нельзя сторнировать чек после закрытия смены",
  "Receipt is already finalized": "Чек уже закрыт",
  "Draft belongs to another cashier": "Этот черновик принадлежит другому кассиру",
  "Sale is not attached to a shift": "Чек не привязан к смене",
  "Draft location must match the open shift": "Точка черновика должна совпадать с открытой сменой",
  "Unknown promo code": "Неизвестный промокод",
  "itemId or productId is required": "Нужно указать изделие или товар",
  "Unique jewelry items are sold with qty = 1": "Уникальное изделие продаётся по одной штуке",
  "Product is out of stock": "Товара нет в наличии",
  "Product has no price": "У товара не указана цена",
  "Line not found": "Позиция чека не найдена",
  "Draft line is missing itemId": "В строке чека нет изделия",
  "Item not found": "Изделие не найдено",
  "Item is not at the shift location": "Изделие находится на другой точке",
  "Item is not available for sale": "Изделие нельзя продать",
  "Insufficient stock": "Нет свободного остатка",
  "Item is already on a draft receipt": "Изделие уже в другом черновике чека",
  "Item is already on this receipt": "Изделие уже в этом чеке",
  "Item is already at this location": "Изделие уже на этой точке",
  "Sold items cannot be moved": "Проданное изделие нельзя переместить",
  "Duplicate unique tags in the payload": "В списке есть повторяющиеся бирки",
  "One or more products were not found": "Один или несколько товаров не найдены",
  "Batch not found": "Партия не найдена",
  "Stock check not found": "Инвентаризация не найдена",
  "Unique tag already exists": "Такая бирка уже существует",
  "Invalid status transition": "Нельзя сменить статус таким образом",
  "Invalid line discounts": "Некорректная скидка по строке",
  "Invalid period": "Некорректный период",
  "Invalid analytics period": "Некорректный период аналитики",
  'Period "from" must be before "to"': "Дата начала должна быть раньше даты окончания",
  "Failed to fetch": "Нет связи с сервером. Проверьте, что бэкенд запущен",
  "NetworkError when attempting to fetch resource.": "Нет связи с сервером. Проверьте подключение",
  "Network request failed": "Нет связи с сервером. Проверьте подключение",
  "Load failed": "Не удалось загрузить данные",
  "Only sold items can be returned to stock": "На склад можно вернуть только проданное изделие",
  "Item cannot be sent to repair": "Изделие нельзя отправить в ремонт",
  "Item is not in repair": "Изделие не в ремонте",
  "Item cannot be sent to cleaning": "Изделие нельзя отправить на чистку",
  "Item is not in cleaning": "Изделие не на чистке",
  "Item cannot be sent to commission": "Изделие нельзя отдать на комиссию",
  "Item is not on commission": "Изделие не на комиссии",
  "Only in-stock items can be put on display": "На витрину можно поставить только товар со склада",
  "Only on-display items can be returned to stock": "На склад можно вернуть только изделие с витрины",
  "Use sales flow to mark an item as sold": "Продажу оформляйте через кассу, а не сменой статуса",
  "Cannot restore item": "Не удалось вернуть изделие",
  "Cannot refund shift totals": "Не удалось сторнировать суммы смены",
  "Refund exceeds shift totals": "Сумма возврата больше итогов смены",
  "Invalid receipt discounts": "Некорректная скидка в чеке",
  "Invalid price": "Некорректная цена",
  "Quantity must be a positive integer": "Количество должно быть целым числом больше нуля",
  "Unit price must be a non-negative integer in kopecks": "Цена должна быть неотрицательной",
  "Invalid line discount": "Некорректная скидка по строке",
  "Line discount exceeds line amount": "Скидка больше суммы строки",
  "Invalid receipt discount": "Некорректная скидка по чеку",
  "Receipt discount exceeds subtotal": "Скидка больше суммы чека",
  "Unknown analytics report": "Неизвестный отчёт аналитики",
  "Online manager can only view the online channel": "Онлайн-менеджер видит только канал онлайн",
  "Store manager must be assigned to a sales location": "Менеджеру салона нужно назначить точку",
  "Analytics is not available for this role": "Аналитика недоступна для этой роли",
  Unauthorized: "Нужно войти в систему",
  Forbidden: "Недостаточно прав",
  "Not Found": "Ничего не найдено",
  "Bad Request": "Некорректный запрос",
  Conflict: "Конфликт данных",
  "Internal Server Error": "Внутренняя ошибка сервера",
  "Too Many Requests": "Слишком много запросов. Подождите немного",
  "ThrottlerException: Too Many Requests": "Слишком много запросов. Подождите немного",
};

const MESSAGES_LOWER: Record<string, string> = Object.fromEntries(
  Object.entries(MESSAGES).map(([key, value]) => [key.toLowerCase(), value]),
);

const HTTP_STATUS: Record<number, string> = {
  400: "Некорректный запрос",
  401: "Нужно войти в систему",
  403: "Недостаточно прав для этого действия",
  404: "Ничего не найдено",
  409: "Нельзя выполнить: есть связанные данные",
  422: "Проверьте введённые данные",
  429: "Слишком много запросов. Подождите немного",
  500: "Ошибка сервера. Попробуйте позже",
};

function fieldLabel(name: string) {
  return FIELD_LABELS[name] ?? name;
}

function translateClassValidator(message: string): string | null {
  const longer = message.match(/^(\S+) must be longer than or equal to (\d+) characters$/i);
  if (longer) {
    return `${fieldLabel(longer[1])}: не короче ${longer[2]} символов`;
  }
  const shorter = message.match(/^(\S+) must be shorter than or equal to (\d+) characters$/i);
  if (shorter) {
    return `${fieldLabel(shorter[1])}: не длиннее ${shorter[2]} символов`;
  }
  const email = message.match(/^(\S+) must be an email$/i);
  if (email) return `${fieldLabel(email[1])}: укажите корректный email`;
  const uuid = message.match(/^(\S+) must be a UUID$/i);
  if (uuid) return `${fieldLabel(uuid[1])}: некорректный идентификатор`;
  const numberString = message.match(/^(\S+) must be a number string$/i);
  if (numberString) return `${fieldLabel(numberString[1])}: укажите число`;
  const empty = message.match(/^(\S+) should not be empty$/i);
  if (empty) return `${fieldLabel(empty[1])}: обязательное поле`;
  const stringType = message.match(/^(\S+) must be a string$/i);
  if (stringType) return `${fieldLabel(stringType[1])}: некорректное значение`;
  const boolType = message.match(/^(\S+) must be a boolean$/i);
  if (boolType) return `${fieldLabel(boolType[1])}: выберите да или нет`;
  const enumType = message.match(/^(\S+) must be one of the following values: (.+)$/i);
  if (enumType) return `${fieldLabel(enumType[1])}: выберите значение из списка`;
  const enumValid = message.match(/^(\S+) must be a valid enum value$/i);
  if (enumValid) return `${fieldLabel(enumValid[1])}: выберите значение из списка`;
  const numberType = message.match(/^(\S+) must be a number$/i);
  if (numberType) return `${fieldLabel(numberType[1])}: укажите число`;
  const status = message.match(/^Cannot change status from (\S+) to (\S+)$/i);
  if (status) return `Нельзя сменить статус с «${status[1]}» на «${status[2]}»`;
  return null;
}

function looksEnglish(text: string) {
  return /[A-Za-z]/.test(text) && !/[А-Яа-яЁё]/.test(text);
}

export function translateMessage(raw: string, status?: number): string {
  const text = raw.trim();
  if (!text) return status && HTTP_STATUS[status] ? HTTP_STATUS[status] : "Неизвестная ошибка";
  if (MESSAGES[text]) return MESSAGES[text];

  const byLower = MESSAGES_LOWER[text.toLowerCase()];
  if (byLower) return byLower;

  const parts = text.split(". ").map((part) => part.trim()).filter(Boolean);
  if (parts.length > 1) {
    return parts.map((part) => translateMessage(part, status)).join(". ");
  }

  const validated = translateClassValidator(text);
  if (validated) return validated;

  if (/[А-Яа-яЁё]/.test(text)) return text;
  if (status && HTTP_STATUS[status] && looksEnglish(text)) return HTTP_STATUS[status];
  if (looksEnglish(text)) return "Не удалось выполнить операцию";
  return text;
}
