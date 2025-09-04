package ru.gigastack.model;

public class CardRecord {
    private final byte[] cardId;
    private final byte[] kMaster;
    private volatile long lastCtr;

    public CardRecord(byte[] cardId, byte[] kMaster, long lastCtr) {
        this.cardId = cardId;
        this.kMaster = kMaster;
        this.lastCtr = lastCtr;
    }
    public byte[] cardId() { return cardId; }
    public byte[] kMaster() { return kMaster; }
    public long lastCtr() { return lastCtr; }
    public void setLastCtr(long v) { this.lastCtr = v; }
}
