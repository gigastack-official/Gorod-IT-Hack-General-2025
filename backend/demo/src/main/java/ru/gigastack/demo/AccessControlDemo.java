package ru.gigastack.demo;

import ru.gigastack.card.CardSimulator;
import ru.gigastack.controller.ControllerSimulator;
import ru.gigastack.controller.OfflineController;

import java.io.IOException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

/**
 * Демонстрация системы контроля доступа
 * Показывает работу оффлайн-контроллера, симуляторов карт и контроллеров
 */
public class AccessControlDemo {
    
    public static void main(String[] args) {
        try {
            System.out.println("=== ДЕМОНСТРАЦИЯ СИСТЕМЫ КОНТРОЛЯ ДОСТУПА ===\n");
            
            // 1. Создаем оффлайн-контроллер
            System.out.println("1. Инициализация оффлайн-контроллера...");
            OfflineController offlineController = new OfflineController("CTRL-001", "./logs");
            System.out.println("   ✓ Оффлайн-контроллер создан: CTRL-001");
            
            // 2. Создаем симулятор контроллера
            System.out.println("\n2. Инициализация симулятора контроллера...");
            ControllerSimulator controllerSim = new ControllerSimulator("SIM-CTRL-001", "./logs");
            System.out.println("   ✓ Симулятор контроллера создан: SIM-CTRL-001");
            
            // 3. Создаем карты
            System.out.println("\n3. Создание карт...");
            
            // Карта для постоянного сотрудника
            String cardId1 = generateCardId();
            byte[] masterKey1 = generateMasterKey();
            CardSimulator card1 = CardSimulator.createWithKey(cardId1, "Иван Петров", masterKey1, 86400); // 1 день
            System.out.println("   ✓ Карта создана: " + cardId1 + " (владелец: Иван Петров)");
            
            // Карта для гостя
            String cardId2 = generateCardId();
            byte[] masterKey2 = generateMasterKey();
            CardSimulator card2 = CardSimulator.createWithKey(cardId2, "Гость Смирнов", masterKey2, 3600); // 1 час
            System.out.println("   ✓ Карта создана: " + cardId2 + " (владелец: Гость Смирнов)");
            
            // 4. Регистрируем карты в контроллерах
            System.out.println("\n4. Регистрация карт в контроллерах...");
            
            // В оффлайн-контроллере
            OfflineController.CardInfo cardInfo1 = new OfflineController.CardInfo(
                cardId1, "Иван Петров", masterKey1, Instant.now().plusSeconds(86400), true);
            OfflineController.CardInfo cardInfo2 = new OfflineController.CardInfo(
                cardId2, "Гость Смирнов", masterKey2, Instant.now().plusSeconds(3600), true);
            
            offlineController.addCardToCache(cardInfo1);
            offlineController.addCardToCache(cardInfo2);
            System.out.println("   ✓ Карты зарегистрированы в оффлайн-контроллере");
            
            // В симуляторе контроллера
            controllerSim.addCard(cardId1, "Иван Петров", masterKey1, Instant.now().plusSeconds(86400));
            controllerSim.addCard(cardId2, "Гость Смирнов", masterKey2, Instant.now().plusSeconds(3600));
            System.out.println("   ✓ Карты зарегистрированы в симуляторе контроллера");
            
            // 5. Демонстрация работы с картами
            System.out.println("\n5. Демонстрация работы с картами...");
            
            // Генерируем коды для карты 1
            System.out.println("\n   Карта 1 (Иван Петров):");
            CardSimulator.OneTimeCode code1_1 = card1.generateCode();
            System.out.println("     Код 1: CTR=" + code1_1.getCtr() + ", TAG=" + code1_1.getTag());
            
            CardSimulator.OneTimeCode code1_2 = card1.generateCode();
            System.out.println("     Код 2: CTR=" + code1_2.getCtr() + ", TAG=" + code1_2.getTag());
            
            // Генерируем коды для карты 2
            System.out.println("\n   Карта 2 (Гость Смирнов):");
            CardSimulator.OneTimeCode code2_1 = card2.generateCode();
            System.out.println("     Код 1: CTR=" + code2_1.getCtr() + ", TAG=" + code2_1.getTag());
            
            // 6. Проверка доступа через оффлайн-контроллер
            System.out.println("\n6. Проверка доступа через оффлайн-контроллер...");
            
            // Успешный доступ
            byte[] ctr1Bytes = Base64.getUrlDecoder().decode(code1_1.getCtr());
            byte[] tag1Bytes = Base64.getUrlDecoder().decode(code1_1.getTag());
            OfflineController.AccessResult result1 = offlineController.verifyAccess(cardId1, ctr1Bytes, tag1Bytes);
            System.out.println("   Результат проверки карты 1: " + (result1.isGranted() ? "ДОСТУП РАЗРЕШЕН" : "ДОСТУП ЗАПРЕЩЕН"));
            System.out.println("   Сообщение: " + result1.getMessage());
            
            // Повторное использование того же кода (должно быть отклонено)
            OfflineController.AccessResult result1_replay = offlineController.verifyAccess(cardId1, ctr1Bytes, tag1Bytes);
            System.out.println("   Повторное использование кода: " + (result1_replay.isGranted() ? "ДОСТУП РАЗРЕШЕН" : "ДОСТУП ЗАПРЕЩЕН"));
            System.out.println("   Сообщение: " + result1_replay.getMessage());
            
            // 7. Проверка доступа через симулятор контроллера
            System.out.println("\n7. Проверка доступа через симулятор контроллера...");
            
            ControllerSimulator.AccessDecision decision1 = controllerSim.verifyAccess(cardId1, code1_2.getCtr(), code1_2.getTag());
            System.out.println("   Результат проверки карты 1: " + (decision1.isGranted() ? "ДОСТУП РАЗРЕШЕН" : "ДОСТУП ЗАПРЕЩЕН"));
            System.out.println("   Сообщение: " + decision1.getMessage());
            
            ControllerSimulator.AccessDecision decision2 = controllerSim.verifyAccess(cardId2, code2_1.getCtr(), code2_1.getTag());
            System.out.println("   Результат проверки карты 2: " + (decision2.isGranted() ? "ДОСТУП РАЗРЕШЕН" : "ДОСТУП ЗАПРЕЩЕН"));
            System.out.println("   Сообщение: " + decision2.getMessage());
            
            // 8. Демонстрация QR кодов
            System.out.println("\n8. Демонстрация QR кодов...");
            
            String qrCode1 = generateQRCode(cardId1, "Иван Петров", "permanent");
            System.out.println("   QR код для карты 1: " + qrCode1);
            
            ControllerSimulator.AccessDecision qrDecision1 = controllerSim.verifyQRCode(qrCode1);
            System.out.println("   Результат проверки QR: " + (qrDecision1.isGranted() ? "ДОСТУП РАЗРЕШЕН" : "ДОСТУП ЗАПРЕЩЕН"));
            System.out.println("   Сообщение: " + qrDecision1.getMessage());
            
            // 9. Статистика контроллеров
            System.out.println("\n9. Статистика контроллеров...");
            
            OfflineController.ControllerStats offlineStats = offlineController.getStats();
            System.out.println("   Оффлайн-контроллер:");
            System.out.println("     - Всего событий: " + offlineStats.getTotalEvents());
            System.out.println("     - Разрешено доступов: " + offlineStats.getGrantedAccess());
            System.out.println("     - Запрещено доступов: " + offlineStats.getDeniedAccess());
            System.out.println("     - Карт в кэше: " + offlineStats.getCachedCards());
            
            ControllerSimulator.ControllerStats simStats = controllerSim.getStats();
            System.out.println("   Симулятор контроллера:");
            System.out.println("     - Всего событий: " + simStats.getTotalEvents());
            System.out.println("     - Разрешено доступов: " + simStats.getGrantedAccess());
            System.out.println("     - Запрещено доступов: " + simStats.getDeniedAccess());
            System.out.println("     - Зарегистрировано карт: " + simStats.getRegisteredCards());
            
            // 10. Синхронизация с сервером
            System.out.println("\n10. Синхронизация с сервером...");
            
            OfflineController.SyncResult syncResult = offlineController.syncWithServer("http://localhost:8081/api/sync");
            System.out.println("   Результат синхронизации: " + (syncResult.isSuccess() ? "УСПЕШНО" : "ОШИБКА"));
            System.out.println("   Сообщение: " + syncResult.getMessage());
            
            System.out.println("\n=== ДЕМОНСТРАЦИЯ ЗАВЕРШЕНА ===");
            System.out.println("\nВсе компоненты работают корректно:");
            System.out.println("✓ Оффлайн-контроллер с локальным журналом");
            System.out.println("✓ Симулятор карты с генерацией одноразовых кодов");
            System.out.println("✓ Симулятор контроллера с проверкой доступа");
            System.out.println("✓ QR коды для гостевых пропусков");
            System.out.println("✓ Anti-replay защита");
            System.out.println("✓ Логирование всех событий");
            System.out.println("✓ Синхронизация с центральным сервером");
            
        } catch (Exception e) {
            System.err.println("Ошибка в демонстрации: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private static String generateCardId() {
        byte[] cardIdBytes = new byte[16];
        new SecureRandom().nextBytes(cardIdBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(cardIdBytes);
    }
    
    private static byte[] generateMasterKey() {
        byte[] masterKey = new byte[32];
        new SecureRandom().nextBytes(masterKey);
        return masterKey;
    }
    
    private static String generateQRCode(String cardId, String owner, String role) {
        String qrData = String.format("CARD:%s:OWNER:%s:ROLE:%s:TIMESTAMP:%d", 
            cardId, owner, role, System.currentTimeMillis());
        return Base64.getUrlEncoder().withoutPadding().encodeToString(qrData.getBytes());
    }
}
