# Релизы

## Автоматические релизы

Проект настроен на автоматическое создание релизов в GitHub и публикацию в npm при создании тегов.

## Настройка NPM_TOKEN

Для автоматической публикации в npm нужно добавить токен:

1. Перейдите в [npm](https://www.npmjs.com/) → Account Settings → Access Tokens
2. Нажмите "Generate New Token" → выберите "Classic Token"
3. Выберите тип "Automation" (для CI/CD)
4. Скопируйте созданный токен
5. В GitHub репозитории: Settings → Secrets and variables → Actions
6. Добавьте новый секрет:
   - **Name**: `NPM_TOKEN`
   - **Value**: ваш npm токен

### Как создать релиз

1. **Patch релиз** (исправления багов):

   ```bash
   bun run release
   ```

2. **Minor релиз** (новые функции):

   ```bash
   bun run release:minor
   ```

3. **Major релиз** (breaking changes):

   ```bash
   bun run release:major
   ```

### Что происходит автоматически

1. Скрипт обновляет версию в `package.json`
2. Создает коммит с новой версией
3. Создает тег `v{version}`
4. Пушит коммит и тег в GitHub
5. GitHub Actions автоматически:
   - Собирает проект
   - Запускает тесты
   - Генерирует документацию
   - Публикует пакет в npm
   - Создает релиз в GitHub
   - Прикрепляет архивы с документацией и дистрибутивом

### Ручное создание релиза

Если нужно создать релиз вручную:

1. Обновите версию в `package.json`
2. Создайте коммит:

   ```bash
   git add package.json
   git commit -m "chore: bump version to X.Y.Z"
   ```

3. Создайте тег:

   ```bash
   git tag vX.Y.Z
   ```

4. Запуште:

   ```bash
   git push origin main
   git push origin vX.Y.Z
   ```

### Архивы релиза

Каждый релиз включает:

- `documentation.zip` - полная документация TypeDoc
- `dist.zip` - собранные файлы для распространения

### Документация

Документация автоматически публикуется на GitHub Pages:
<https://zavx0z.github.io/html-parser/>
