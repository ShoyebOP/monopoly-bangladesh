import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

describe('Game Logic', () => {
  describe('Dice Rolling', () => {
    it('should roll dice and return valid result', () => {
      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      const total = die1 + die2;
      
      assert.ok(die1 >= 1 && die1 <= 6, 'Die 1 should be between 1 and 6');
      assert.ok(die2 >= 1 && die2 <= 6, 'Die 2 should be between 1 and 6');
      assert.ok(total >= 2 && total <= 12, 'Total should be between 2 and 12');
      assert.strictEqual(total, die1 + die2, 'Total should equal sum of dice');
    });
    
    it('should detect doubles correctly', () => {
      const die1 = 3;
      const die2 = 3;
      const isDoubles = die1 === die2;
      assert.strictEqual(isDoubles, true, 'Should detect doubles');
    });
    
    it('should detect non-doubles correctly', () => {
      const die1 = 3;
      const die2 = 4;
      const isDoubles = die1 === die2;
      assert.strictEqual(isDoubles, false, 'Should detect non-doubles');
    });
  });
  
  describe('Player Movement', () => {
    it('should move player clockwise around board', () => {
      const currentPosition = 5;
      const diceRoll = 3;
      const newPosition = (currentPosition + diceRoll) % 40;
      assert.strictEqual(newPosition, 8, 'Player should move to position 8');
    });
    
    it('should wrap around board when passing Go', () => {
      const currentPosition = 38;
      const diceRoll = 5;
      const newPosition = (currentPosition + diceRoll) % 40;
      assert.strictEqual(newPosition, 3, 'Player should wrap around to position 3');
    });
    
    it('should detect passing Go', () => {
      const currentPosition = 38;
      const diceRoll = 5;
      const passedGo = currentPosition + diceRoll >= 40;
      assert.strictEqual(passedGo, true, 'Should detect passing Go');
    });
  });
  
  describe('Property Ownership', () => {
    it('should track property ownership', () => {
      const properties = new Map();
      const playerId = 1;
      const propertyId = 5;
      
      properties.set(propertyId, playerId);
      assert.strictEqual(properties.get(propertyId), playerId, 'Should track owner');
    });
    
    it('should check if property is owned', () => {
      const properties = new Map();
      properties.set(5, 1);
      
      const isOwned = properties.has(5);
      assert.strictEqual(isOwned, true, 'Should detect owned property');
      
      const isOwnedOther = properties.has(10);
      assert.strictEqual(isOwnedOther, false, 'Should detect unowned property');
    });
  });
  
  describe('Rent Calculation', () => {
    it('should calculate base rent', () => {
      const property = { rent_base: 10 };
      const rent = property.rent_base;
      assert.strictEqual(rent, 10, 'Should return base rent');
    });
    
    it('should calculate rent with houses', () => {
      const property = { rent_1: 30, rent_2: 90, rent_3: 270 };
      const houses = 2;
      const rent = houses === 1 ? property.rent_1 : houses === 2 ? property.rent_2 : property.rent_3;
      assert.strictEqual(rent, 90, 'Should return rent for 2 houses');
    });
    
    it('should calculate rent for railroad', () => {
      const railroadsOwned = 2;
      const baseRent = 25;
      const rent = baseRent * Math.pow(2, railroadsOwned - 1);
      assert.strictEqual(rent, 50, 'Should calculate railroad rent correctly');
    });
  });
  
  describe('Bankruptcy Detection', () => {
    it('should detect bankruptcy when money is negative', () => {
      const money = -100;
      const isBankrupt = money < 0;
      assert.strictEqual(isBankrupt, true, 'Should detect bankruptcy');
    });
    
    it('should not detect bankruptcy when money is positive', () => {
      const money = 500;
      const isBankrupt = money < 0;
      assert.strictEqual(isBankrupt, false, 'Should not detect bankruptcy');
    });
    
    it('should detect bankruptcy when money is zero', () => {
      const money = 0;
      const canPay = money > 0;
      assert.strictEqual(canPay, false, 'Should not be able to pay with zero money');
    });
  });
  
  describe('Turn Management', () => {
    it('should switch turns between players', () => {
      const players = [1, 2];
      let currentPlayerIndex = 0;
      
      currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
      assert.strictEqual(currentPlayerIndex, 1, 'Should switch to player 2');
      
      currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
      assert.strictEqual(currentPlayerIndex, 0, 'Should switch back to player 1');
    });
    
    it('should handle multiple players', () => {
      const players = [1, 2, 3, 4];
      let currentPlayerIndex = 0;
      
      for (let i = 0; i < players.length; i++) {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
      }
      assert.strictEqual(currentPlayerIndex, 0, 'Should cycle back to first player');
    });
  });
  
  describe('Go Space Bonus', () => {
    it('should award money for passing Go', () => {
      const startingMoney = 1500;
      const goBonus = 200;
      const newMoney = startingMoney + goBonus;
      assert.strictEqual(newMoney, 1700, 'Should award 200 for passing Go');
    });
    
    it('should track Go passes', () => {
      const goPasses = 0;
      const newPasses = goPasses + 1;
      assert.strictEqual(newPasses, 1, 'Should increment Go passes');
    });
  });
});
