(() => {
    const itemCatalog = window.Game.systems.itemCatalog = window.Game.systems.itemCatalog || {};
    const resourceRegistry = window.Game.systems.resourceRegistry || null;
    const componentRegistry = window.Game.systems.componentRegistry || null;

    const tierWindows = {
        1: { minIsland: 2, maxIsland: 5, label: 'T1' },
        2: { minIsland: 6, maxIsland: 10, label: 'T2' },
        3: { minIsland: 11, maxIsland: 15, label: 'T3' },
        4: { minIsland: 16, maxIsland: 20, label: 'T4' },
        5: { minIsland: 21, maxIsland: 25, label: 'T5' },
        6: { minIsland: 26, maxIsland: 30, label: 'T6' }
    };

    const questCategoryLabels = {
        food: 'еда',
        survival: 'выживание',
        consumable: 'расходник',
        movement: 'движение',
        tool: 'инструмент',
        utility: 'утилита',
        value: 'ценность',
        risk: 'рискованный предмет'
    };

    function makeItem(id, label, icon, lootTier, categories, extra = {}) {
        return {
            id,
            label,
            icon,
            lootTier,
            categories: categories.split(' '),
            stackable: false,
            rarity: 'common',
            description: '',
            chestWeight: 0,
            merchantWeight: 0,
            merchantQuestWeight: 0,
            baseValue: 0,
            ...extra
        };
    }

    function getBaseResourceCatalogEntries() {
        return resourceRegistry && typeof resourceRegistry.buildCatalogEntries === 'function'
            ? resourceRegistry.buildCatalogEntries(makeItem)
            : [];
    }

    function getCraftingComponentCatalogEntries() {
        return componentRegistry && typeof componentRegistry.buildCatalogEntries === 'function'
            ? componentRegistry.buildCatalogEntries(makeItem)
            : [];
    }

    const items = [
        makeItem('ration', 'Сухпаёк путника', 'SP', 1, 'consumable survival food', {
            stackable: true,
            chestWeight: 10,
            merchantWeight: 10,
            baseValue: 6,
            description: 'Полностью сбивает голод и добавляет немного сил.',
            consumable: { hunger: 100, energy: 20, focus: 4 }
        }),
        makeItem('breadRation', 'Большой паёк', 'BP', 2, 'consumable survival food', {
            stackable: true,
            chestWeight: 10,
            merchantWeight: 9,
            baseValue: 10,
            description: 'Полностью сбивает голод и хорошо восстанавливает энергию.',
            consumable: { hunger: 100, energy: 40, focus: 8 }
        }),
        makeItem('powerConcentrate', 'Концентрат сил', 'KS', 2, 'consumable survival', {
            stackable: true,
            chestWeight: 7,
            merchantWeight: 8,
            baseValue: 12,
            description: 'Даёт силу, но немного увеличивает расход до конца острова.',
            consumable: { energy: 30, focus: 8 },
            activeEffect: { kind: 'islandBuff', label: 'Перегрев', drainMultiplier: 1.1 }
        }),
        makeItem('vigorFlask', 'Фляга бодрости', 'FB', 2, 'consumable survival movement', {
            stackable: true,
            chestWeight: 7,
            merchantWeight: 8,
            baseValue: 14,
            description: 'Даёт бодрость и на несколько шагов уменьшает цену движения.',
            consumable: { energy: 20, focus: 10 },
            activeEffect: { kind: 'travelBuff', discountMultiplier: 0.5, durationSteps: 10 }
        }),
        makeItem('scoutDash', 'Рывок разведчика', 'RD', 1, 'consumable movement', {
            stackable: true,
            chestWeight: 6,
            merchantWeight: 6,
            baseValue: 11,
            description: 'Даёт серию бесплатных шагов.',
            activeEffect: { kind: 'travelBuff', freeSteps: 8 }
        }),
        makeItem('sugarInfusion', 'Сахарный настой', 'SN', 2, 'consumable survival utility', {
            stackable: true,
            chestWeight: 5,
            merchantWeight: 6,
            baseValue: 12,
            description: 'Быстро возвращает силы и немного улучшает следующий сундук.',
            consumable: { energy: 15, focus: 6 },
            activeEffect: { kind: 'nextChestBuff', extraRolls: 1 }
        }),
        makeItem('herbalDecoction', 'Травяной отвар', 'TO', 2, 'consumable survival', {
            stackable: true,
            chestWeight: 6,
            merchantWeight: 7,
            baseValue: 12,
            description: 'Снимает часть негативных дорожных эффектов.',
            consumable: { energy: 25, cold: 12, focus: 10 },
            activeEffect: { kind: 'clearTravelPenalty' }
        }),
        makeItem('survivalSalt', 'Соль выживания', 'SV', 2, 'consumable survival utility', {
            stackable: true,
            chestWeight: 5,
            merchantWeight: 6,
            baseValue: 13,
            description: 'Поднимает силы и даёт одно игнорирование плохого дома или ловушки.',
            consumable: { energy: 20 },
            activeEffect: { kind: 'trapWard', charges: 1 }
        }),
        makeItem('emergencyRation', 'Экстренный рацион', 'ER', 2, 'consumable survival food', {
            stackable: true,
            chestWeight: 5,
            merchantWeight: 6,
            baseValue: 12,
            description: 'Резервный паёк для критического момента.',
            consumable: { hunger: 100, energy: 15 }
        }),
        makeItem('fieldKit', 'Полевой набор', 'PN', 3, 'consumable survival movement', {
            chestWeight: 4,
            merchantWeight: 5,
            baseValue: 18,
            description: 'Аварийный комплект: восстанавливает силы и дарит несколько бесплатных шагов.',
            consumable: { energy: 30, focus: 10 },
            activeEffect: { kind: 'travelBuff', freeSteps: 5 }
        }),
        makeItem('roadDust', 'Пыль дороги', 'PD', 2, 'consumable movement', {
            stackable: true,
            chestWeight: 5,
            merchantWeight: 6,
            baseValue: 11,
            description: 'Снижает цену движения на несколько шагов.',
            activeEffect: { kind: 'travelBuff', discountMultiplier: 0.8, durationSteps: 12 }
        }),
        makeItem('napkinMap', 'Карта на салфетке', 'KS', 2, 'consumable utility info', {
            stackable: true,
            chestWeight: 4,
            merchantWeight: 5,
            baseValue: 12,
            description: 'Даёт наводку на лучший дом текущего острова.',
            activeEffect: { kind: 'revealBestHouse' }
        }),
        makeItem('scoutingScroll', 'Свиток разведки', 'SR', 3, 'consumable utility info', {
            stackable: true,
            chestWeight: 4,
            merchantWeight: 4,
            baseValue: 18,
            description: 'Открывает большую часть карты текущего острова.',
            activeEffect: { kind: 'revealMap', mode: 'halfIsland' }
        }),
        makeItem('luckTalisman', 'Талисман удачи', 'TU', 3, 'consumable utility', {
            stackable: true,
            chestWeight: 3,
            merchantWeight: 4,
            baseValue: 18,
            description: 'Гарантирует, что следующий сундук не окажется пустым.',
            activeEffect: { kind: 'nextChestBuff', preventEmpty: true }
        }),
        makeItem('agilityAmpoule', 'Ампула прыти', 'AP', 3, 'consumable movement', {
            stackable: true,
            chestWeight: 4,
            merchantWeight: 4,
            baseValue: 18,
            description: 'Даёт короткую серию шагов без штрафов сложной местности.',
            activeEffect: { kind: 'travelBuff', ignoreTravelZones: true, durationSteps: 5 }
        }),
        makeItem('carbPack', 'Пакет углеводов', 'PU', 3, 'consumable survival food', {
            stackable: true,
            chestWeight: 3,
            merchantWeight: 4,
            baseValue: 18,
            description: 'Сильно восстанавливает энергию, но немного ухудшает эффективность еды до конца острова.',
            consumable: { hunger: 100, energy: 35 },
            activeEffect: { kind: 'islandBuff', foodRecoveryMultiplier: 0.9 }
        }),
        makeItem('blackCoffee', 'Чёрный кофе', 'CF', 3, 'consumable survival', {
            stackable: true,
            chestWeight: 3,
            merchantWeight: 4,
            baseValue: 16,
            description: 'Сильно бодрит, но немного повышает цену движения до конца острова.',
            consumable: { energy: 25, focus: 20 },
            activeEffect: { kind: 'islandBuff', travelCostMultiplier: 1.05 }
        }),
        makeItem('signalWhistle', 'Сигнальный свисток', 'SW', 3, 'consumable utility info', {
            chestWeight: 3,
            merchantWeight: 4,
            baseValue: 17,
            description: 'Даёт точную наводку на торговца текущего острова.',
            activeEffect: { kind: 'revealMerchant' }
        }),
        makeItem('pathMarker', 'Маркер пути', 'MP', 3, 'consumable utility movement', {
            stackable: true,
            chestWeight: 3,
            merchantWeight: 4,
            baseValue: 17,
            description: 'Показывает самый дешёвый маршрут к выбранной цели.',
            activeEffect: { kind: 'cheapestRouteHint' }
        }),
        makeItem('dryRoot', 'Сухой корень', 'SK', 2, 'consumable survival', {
            stackable: true,
            chestWeight: 4,
            merchantWeight: 4,
            baseValue: 14,
            description: 'Даёт силы и маленькую страховку на следующий тяжёлый шаг.',
            consumable: { energy: 20, focus: 4 },
            activeEffect: { kind: 'travelBuff', freeSteps: 1 }
        }),
        makeItem('portableBridge', 'Переносной мост', 'PM', 2, 'tool utility movement', {
            chestWeight: 5,
            merchantWeight: 6,
            baseValue: 18,
            description: 'Позволяет уложить одну клетку моста.',
            activeEffect: { kind: 'bridgeBuilder', charges: 1 }
        }),
        makeItem('reinforcedBridge', 'Усиленный мост', 'UM', 3, 'tool utility movement', {
            chestWeight: 4,
            merchantWeight: 5,
            baseValue: 24,
            description: 'Позволяет уложить две клетки моста.',
            activeEffect: { kind: 'bridgeBuilder', charges: 2 }
        }),
        makeItem('hookRope', 'Крюк-верёвка', 'KV', 2, 'tool movement utility', {
            chestWeight: 4,
            merchantWeight: 5,
            baseValue: 16,
            description: 'Облегчает проход через тяжёлые зоны и узкие места.',
            activeEffect: { kind: 'travelBuff', ignoreTravelZones: true, durationSteps: 4 }
        }),
        makeItem('fishingRod', 'Удочка путника', 'UP', 2, 'tool survival utility food', {
            chestWeight: 0,
            merchantWeight: 1,
            baseValue: 18,
            description: 'Дар рыбака. Делает еду и короткий отдых заметно полезнее на длинных островах.',
            passive: {
                foodRecoveryMultiplier: 1.18,
                recoveryMultiplier: 1.05
            }
        }),
        makeItem('smallPickaxe', 'Кирка разведчика', 'KR', 2, 'tool utility', {
            chestWeight: 3,
            merchantWeight: 4,
            merchantQuestWeight: 3,
            baseValue: 20,
            description: 'Тяжёлая полезная вещь для ремесленников и обмена.'
        }),
        makeItem('doublePickaxe', 'Двойная кирка', 'DK', 3, 'tool utility', {
            chestWeight: 3,
            merchantWeight: 4,
            merchantQuestWeight: 2,
            baseValue: 26,
            description: 'Усиленная кирка для поздних островов.'
        }),
        makeItem('lightBoat', 'Лёгкая лодка', 'LL', 3, 'tool utility movement', {
            chestWeight: 2,
            merchantWeight: 3,
            baseValue: 26,
            description: 'Редкий походный инструмент для поздних квестов и обменов.'
        }),
        makeItem('foldingBoat', 'Складная лодка', 'SL', 4, 'tool utility movement', {
            chestWeight: 2,
            merchantWeight: 3,
            baseValue: 34,
            description: 'Продвинутый инструмент для поздней игры.'
        }),
        makeItem('returnMarker', 'Метка возврата', 'MV', 3, 'tool utility movement', {
            chestWeight: 3,
            merchantWeight: 3,
            baseValue: 26,
            description: 'Возвращает на вход текущего острова.',
            activeEffect: { kind: 'teleportToEntry' }
        }),
        makeItem('emergencyTeleport', 'Аварийный телепорт', 'AT', 4, 'tool utility movement', {
            chestWeight: 2,
            merchantWeight: 3,
            baseValue: 38,
            description: 'Переносит на ближайшую безопасную клетку.',
            activeEffect: { kind: 'teleportToSafe' }
        }),
        makeItem('fogLantern', 'Фонарь тумана', 'FT', 3, 'tool utility info', {
            chestWeight: 3,
            merchantWeight: 4,
            baseValue: 24,
            description: 'Открывает карту вокруг героя на текущем острове.',
            activeEffect: { kind: 'revealMap', mode: 'currentViewBoost' }
        }),
        makeItem('merchantBeacon', 'Маяк торговца', 'MT', 3, 'tool utility info', {
            chestWeight: 2,
            merchantWeight: 4,
            baseValue: 22,
            description: 'Показывает координаты торговца текущего острова.',
            activeEffect: { kind: 'revealMerchant' }
        }),
        makeItem('bypassCompass', 'Компас обхода', 'KO', 4, 'tool utility movement', {
            chestWeight: 2,
            merchantWeight: 3,
            baseValue: 28,
            description: 'Позволяет несколько шагов идти без штрафов плохих зон.',
            activeEffect: { kind: 'travelBuff', ignoreTravelZones: true, durationSteps: 10 }
        }),
        makeItem('explosiveCharge', 'Заряд взрывчатки', 'ZV', 4, 'tool utility risk', {
            chestWeight: 2,
            merchantWeight: 2,
            baseValue: 28,
            description: 'Опасный инструмент поздней игры.'
        }),
        makeItem('fieldBridge', 'Полевой мостик', 'PB', 4, 'tool utility movement', {
            chestWeight: 2,
            merchantWeight: 3,
            baseValue: 30,
            description: 'Укладывает сразу две клетки моста.',
            activeEffect: { kind: 'bridgeBuilder', charges: 2 }
        }),
        makeItem('crossingCable', 'Трос переправы', 'TP', 4, 'tool utility movement', {
            chestWeight: 2,
            merchantWeight: 3,
            baseValue: 28,
            description: 'Снижает цену переправ и тяжёлых переходов до конца острова.',
            activeEffect: { kind: 'islandBuff', travelCostMultiplier: 0.88 }
        }),
        makeItem('climberHook', 'Крюк альпиниста', 'KA', 4, 'tool movement utility', {
            chestWeight: 2,
            merchantWeight: 3,
            baseValue: 28,
            description: 'Сильно облегчает тяжёлые проходы на несколько шагов.',
            activeEffect: { kind: 'travelBuff', discountMultiplier: 0.7, durationSteps: 8 }
        }),
        makeItem('roadChalk', 'Мел дорожника', 'MD', 2, 'tool utility info', {
            chestWeight: 2,
            merchantWeight: 4,
            baseValue: 14,
            description: 'Даёт подсказку по самому дешёвому пути.',
            activeEffect: { kind: 'cheapestRouteHint' }
        }),
        makeItem('foldingRam', 'Складной таран', 'ST', 4, 'tool utility risk', {
            chestWeight: 1,
            merchantWeight: 2,
            baseValue: 32,
            description: 'Опасная, но полезная утилита для поздних островов.'
        }),
        makeItem('masterKey', 'Ключ мастера', 'KM', 5, 'tool utility', {
            chestWeight: 1,
            merchantWeight: 2,
            baseValue: 42,
            description: 'Редкий мастерский инструмент для позднего обмена и сильных сборок.'
        }),
        makeItem('safeHouseSeal', 'Печать безопасного дома', 'PD', 4, 'tool utility survival', {
            chestWeight: 2,
            merchantWeight: 3,
            baseValue: 30,
            description: 'Позволяет один раз проигнорировать штраф пустого или опасного дома.',
            activeEffect: { kind: 'trapWard', charges: 1 }
        }),
        makeItem('travelBoots', 'Сапоги странника', 'SS', 2, 'artifact movement', {
            chestWeight: 3,
            merchantWeight: 2,
            baseValue: 24,
            description: 'Снижают стоимость движения на 10%.',
            passive: { travelCostMultiplier: 0.9 }
        }),
        makeItem('lightStepBoots', 'Сапоги лёгкого шага', 'LS', 3, 'artifact movement', {
            chestWeight: 3,
            merchantWeight: 2,
            baseValue: 30,
            description: 'Снижают стоимость движения на 15%.',
            passive: { travelCostMultiplier: 0.85 }
        }),
        makeItem('windBoots', 'Сапоги ветра', 'SV', 4, 'artifact movement', {
            chestWeight: 2,
            merchantWeight: 2,
            baseValue: 36,
            description: 'Снижают стоимость движения на 20%.',
            passive: { travelCostMultiplier: 0.8 }
        }),
        makeItem('stormBoots', 'Сапоги буревестника', 'SB', 5, 'artifact movement risk', {
            chestWeight: 2,
            merchantWeight: 1,
            baseValue: 44,
            description: 'Очень сильные сапоги с небольшим риском истощения.',
            passive: { travelCostMultiplier: 0.75, drainMultiplier: 1.05 }
        }),
        makeItem('trailCloak', 'Плащ троп', 'PT', 3, 'artifact movement', {
            chestWeight: 2,
            merchantWeight: 2,
            baseValue: 28,
            description: 'Особенно хорош на длинных маршрутах.',
            passive: { longRouteTravelCostMultiplier: 0.88 }
        }),
        makeItem('inertiaRing', 'Кольцо инерции', 'KI', 4, 'artifact movement', {
            chestWeight: 2,
            merchantWeight: 2,
            baseValue: 32,
            description: 'Чем длиннее серия шагов, тем дешевле она обходится.',
            passive: { chainTravelDiscount: 0.03 }
        }),
        makeItem('bypassAmulet', 'Амулет обхода', 'AO', 4, 'artifact movement', {
            chestWeight: 2,
            merchantWeight: 2,
            baseValue: 32,
            description: 'Удешевляет тяжёлые клетки.',
            passive: { roughTravelCostMultiplier: 0.78 }
        }),
        makeItem('shortestPathCompass', 'Компас кратчайшего пути', 'KP', 4, 'artifact movement utility info', {
            chestWeight: 2,
            merchantWeight: 2,
            baseValue: 34,
            description: 'Делает путь дешевле и помогает в навигации.',
            passive: { travelCostMultiplier: 0.92 }
        }),
        makeItem('fogSoles', 'Подошвы тумана', 'PT', 4, 'artifact movement', {
            chestWeight: 2,
            merchantWeight: 2,
            baseValue: 36,
            description: 'Игнорируют истощающие низины и плохие сектора.',
            passive: { ignoreTravelZones: ['drainingLowland', 'badSector'] }
        }),
        makeItem('runnerBelt', 'Пояс бегуна', 'PB', 4, 'artifact movement', {
            chestWeight: 2,
            merchantWeight: 2,
            baseValue: 32,
            description: 'Добавляет запас длины маршрута.',
            passive: { routeLengthBonus: 1 }
        }),
        makeItem('roadStone', 'Камень дороги', 'KD', 3, 'artifact movement', {
            chestWeight: 2,
            merchantWeight: 1,
            baseValue: 28,
            description: 'Даёт мягкое удешевление движения.',
            passive: { travelCostMultiplier: 0.9 }
        }),
        makeItem('ferrymanSign', 'Знак переправщика', 'ZP', 4, 'artifact movement utility', {
            chestWeight: 1,
            merchantWeight: 1,
            baseValue: 32,
            description: 'Делает мосты и переправы дешевле.',
            passive: { bridgeTravelCostMultiplier: 0.72 }
        }),
        makeItem('travelCord', 'Шнур странствий', 'SH', 4, 'artifact movement', {
            chestWeight: 1,
            merchantWeight: 1,
            baseValue: 34,
            description: 'Даёт первые бесплатные шаги каждого перехода.',
            passive: { freeOpeningSteps: 2 }
        }),
        makeItem('distanceTalisman', 'Талисман дистанции', 'TD', 4, 'artifact movement', {
            chestWeight: 1,
            merchantWeight: 1,
            baseValue: 34,
            description: 'Особенно хорош для дальних целей.',
            passive: { longRouteTravelCostMultiplier: 0.82 }
        }),
        makeItem('accelerationSphere', 'Сфера ускорения', 'SU', 5, 'artifact movement', {
            chestWeight: 1,
            merchantWeight: 1,
            baseValue: 42,
            description: 'Сильное универсальное ускорение.',
            passive: { travelCostMultiplier: 0.7 }
        }),
        makeItem('chainStepsAmulet', 'Амулет цепи шагов', 'AC', 5, 'artifact movement', {
            chestWeight: 1,
            merchantWeight: 1,
            baseValue: 40,
            description: 'Поощряет длинные непрерывные маршруты.',
            passive: { chainTravelDiscount: 0.05 }
        }),
        makeItem('windDust', 'Пыль ветров', 'PV', 4, 'artifact movement', {
            chestWeight: 1,
            merchantWeight: 1,
            baseValue: 34,
            description: 'Даёт стабильное удешевление движения.',
            passive: { travelCostMultiplier: 0.8 }
        }),
        makeItem('shortPathRing', 'Кольцо короткого пути', 'KK', 4, 'artifact movement', {
            chestWeight: 1,
            merchantWeight: 1,
            baseValue: 36,
            description: 'Стягивает цену длинных маршрутов.',
            passive: { longRouteTravelCostMultiplier: 0.78 }
        }),
        makeItem('bypasserCloak', 'Плащ обходчика', 'PO', 5, 'artifact movement', {
            chestWeight: 1,
            merchantWeight: 1,
            baseValue: 42,
            description: 'Игнорирует узкие и тяжёлые проходы.',
            passive: {
                roughTravelCostMultiplier: 0.68,
                ignoreTravelZones: ['dangerPass', 'cursedTrail']
            }
        }),
        makeItem('heartOfTheRoad', 'Сердце дороги', 'SD', 5, 'artifact movement', {
            chestWeight: 1,
            merchantWeight: 1,
            baseValue: 48,
            description: 'Один из лучших предметов движения до легендарок.',
            passive: { travelCostMultiplier: 0.6 }
        }),
        makeItem('appraiserMonocle', 'Монокль оценщика', 'MO', 3, 'artifact utility info', {
            chestWeight: 2,
            merchantWeight: 2,
            baseValue: 28,
            description: 'Позволяет лучше оценивать дома и предметы.',
            passive: { showHouseValue: true }
        }),
        makeItem('treasurePurse', 'Кошель кладоискателя', 'KK', 3, 'artifact utility', {
            chestWeight: 2,
            merchantWeight: 1,
            baseValue: 30,
            description: 'Увеличивает золотую добычу из сундуков.',
            passive: { goldLootMultiplier: 1.25 }
        }),
        makeItem('greedStone', 'Камень жадности', 'KJ', 4, 'artifact utility risk', {
            chestWeight: 2,
            merchantWeight: 1,
            baseValue: 34,
            description: 'Даёт больше золота, но повышает цену движения.',
            passive: { goldLootMultiplier: 1.5, travelCostMultiplier: 1.15 }
        }),
        makeItem('merchantToken', 'Жетон торговца', 'JT', 3, 'artifact utility', {
            chestWeight: 2,
            merchantWeight: 1,
            baseValue: 26,
            description: 'Даёт скидки у торговцев.',
            passive: { merchantBuyMultiplier: 0.88 }
        }),
        makeItem('luckSeal', 'Печать удачи', 'PU', 4, 'artifact utility', {
            chestWeight: 1,
            merchantWeight: 1,
            baseValue: 34,
            description: 'Немного улучшает сундуки.',
            passive: { chestLuck: 1 }
        }),
        makeItem('collectorBag', 'Сумка сборщика', 'SS', 4, 'artifact utility', {
            chestWeight: 1,
            merchantWeight: 1,
            baseValue: 34,
            description: 'Любимая вещь коллекционеров и квестодателей сумки.'
        }),
        makeItem('provisionSack', 'Мешок провизии', 'MP', 4, 'artifact survival utility', {
            chestWeight: 1,
            merchantWeight: 1,
            baseValue: 34,
            description: 'Делает еду заметно эффективнее.',
            passive: { foodRecoveryMultiplier: 1.25 }
        }),
        makeItem('barterAmulet', 'Амулет обмена', 'AO', 4, 'artifact utility', {
            chestWeight: 1,
            merchantWeight: 1,
            baseValue: 34,
            description: 'Улучшает цену продажи находок.',
            passive: { merchantSellMultiplier: 1.2 }
        }),
        makeItem('chestMirror', 'Зеркало сундука', 'ZS', 4, 'artifact utility', {
            chestWeight: 1,
            merchantWeight: 1,
            baseValue: 36,
            description: 'Копирует лучший дроп следующего сундука.',
            activeEffect: { kind: 'nextChestBuff', duplicateBestDrop: true }
        }),
        makeItem('featherOfLuck', 'Перо удачи', 'PU', 4, 'artifact utility', {
            chestWeight: 1,
            merchantWeight: 1,
            baseValue: 34,
            description: 'Один раз отменяет пустой сундук.',
            activeEffect: { kind: 'nextChestBuff', preventEmpty: true }
        }),
        makeItem('wealthKey', 'Ключ богатства', 'KB', 5, 'artifact utility', {
            chestWeight: 1,
            merchantWeight: 1,
            baseValue: 42,
            description: 'Улучшает награды богатых и элитных сундуков.',
            passive: { chestLuck: 2 }
        }),
        makeItem('reliquary', 'Реликварий', 'RL', 5, 'artifact utility value', {
            chestWeight: 1,
            merchantWeight: 1,
            merchantQuestWeight: 1,
            baseValue: 46,
            description: 'Редкая и дорогая вещь. Особенно ценится в квестах сумки.'
        }),
        makeItem('doubleFindStone', 'Камень двойной находки', 'DN', 5, 'artifact utility', {
            chestWeight: 1,
            merchantWeight: 1,
            baseValue: 42,
            description: 'Даёт шанс получить больше лута из сундуков.',
            passive: { goldLootMultiplier: 1.35, chestLuck: 1 }
        }),
        makeItem('abundanceTalisman', 'Талисман изобилия', 'TI', 5, 'artifact utility survival', {
            chestWeight: 1,
            merchantWeight: 1,
            baseValue: 40,
            description: 'Повышает шансы на расходники и немного усиливает восстановление.',
            passive: { recoveryMultiplier: 1.1, foodRecoveryMultiplier: 1.15 }
        }),
        makeItem('dealSeal', 'Печать сделки', 'PS', 5, 'artifact utility', {
            chestWeight: 1,
            merchantWeight: 1,
            baseValue: 40,
            description: 'Даёт сильную скидку на покупку одной редкой вещи.',
            passive: { merchantBuyMultiplier: 0.8 }
        }),
        makeItem('idolOfGreed', 'Идол жадности', 'IJ', 4, 'artifact risk', {
            chestWeight: 1,
            baseValue: 38,
            rarity: 'cursed',
            description: 'Даёт много золота, но сильно повышает цену движения.',
            passive: { goldLootMultiplier: 2, travelCostMultiplier: 1.3 }
        }),
        makeItem('exhaustionRing', 'Кольцо истощения', 'KI', 4, 'artifact risk', {
            chestWeight: 1,
            baseValue: 34,
            rarity: 'cursed',
            description: 'Даёт силу восстановления, но делает каждый шаг тяжелее.',
            passive: { recoveryMultiplier: 1.18, drainMultiplier: 1.18 }
        }),
        makeItem('cursedBoot', 'Проклятый сапог', 'PS', 4, 'artifact risk movement', {
            chestWeight: 1,
            baseValue: 34,
            rarity: 'cursed',
            description: 'Делает путь дешевле, но добавляет болезненный расход.',
            passive: { travelCostMultiplier: 0.8, drainMultiplier: 1.12 }
        }),
        makeItem('chaosSphere', 'Сфера хаоса', 'SH', 5, 'artifact risk', {
            chestWeight: 1,
            baseValue: 44,
            rarity: 'cursed',
            description: 'Смешивает сильные бонусы и штрафы.',
            passive: { goldLootMultiplier: 1.4, travelCostMultiplier: 0.9, drainMultiplier: 1.15 }
        }),
        makeItem('blackContract', 'Чёрный контракт', 'CK', 5, 'artifact risk', {
            chestWeight: 1,
            baseValue: 40,
            rarity: 'cursed',
            description: 'Даёт выгодные сделки, но ухудшает восстановление.',
            passive: { merchantBuyMultiplier: 0.75, recoveryMultiplier: 0.88 }
        }),
        makeItem('instabilityStone', 'Камень нестабильности', 'KN', 5, 'artifact risk', {
            chestWeight: 1,
            baseValue: 42,
            rarity: 'cursed',
            description: 'Сильная нестабильная вещь для опасных сборок.',
            passive: { chestLuck: 2, drainMultiplier: 1.12 }
        }),
        makeItem('debtSign', 'Знак долга', 'ZD', 5, 'artifact risk', {
            chestWeight: 1,
            baseValue: 42,
            rarity: 'cursed',
            description: 'Даёт золото и хорошие продажи, но повышает цену покупки и движения.',
            passive: {
                goldLootMultiplier: 1.5,
                merchantSellMultiplier: 1.15,
                merchantBuyMultiplier: 1.1,
                travelCostMultiplier: 1.08
            }
        }),
        makeItem('riskSeal', 'Печать риска', 'PR', 4, 'artifact risk', {
            chestWeight: 1,
            baseValue: 36,
            rarity: 'cursed',
            description: 'Улучшает сундуки, но повышает шанс неприятных исходов.',
            passive: { chestLuck: 2, drainMultiplier: 1.08 }
        }),
        makeItem('gamblerTalisman', 'Талисман азарта', 'TA', 5, 'artifact risk', {
            chestWeight: 1,
            baseValue: 40,
            rarity: 'cursed',
            description: 'Играет с удачей и лутом на грани.',
            passive: { chestLuck: 1, goldLootMultiplier: 1.3, drainMultiplier: 1.1 }
        }),
        makeItem('lossRing', 'Кольцо утраты', 'KU', 5, 'artifact risk', {
            chestWeight: 1,
            baseValue: 42,
            rarity: 'cursed',
            description: 'Сильная, но опасная вещь для экстремальных сборок.',
            passive: { travelCostMultiplier: 0.78, recoveryMultiplier: 0.82 }
        }),
        makeItem('trapIdol', 'Идол ловушки', 'IL', 4, 'artifact risk', {
            chestWeight: 1,
            baseValue: 34,
            rarity: 'cursed',
            description: 'Частично улучшает лут, но любит подмешивать штрафы.',
            passive: { chestLuck: 1, drainMultiplier: 1.1 }
        }),
        makeItem('cursedRelic', 'Проклятая реликвия', 'PR', 5, 'artifact risk value', {
            chestWeight: 1,
            merchantQuestWeight: 1,
            baseValue: 48,
            rarity: 'cursed',
            description: 'Очень ценная, но тяжёлая морально и механически вещь.',
            passive: { goldLootMultiplier: 1.25, drainMultiplier: 1.08 }
        }),
        makeItem('brokenCompass', 'Сломанный компас', 'SK', 4, 'artifact risk movement', {
            chestWeight: 1,
            baseValue: 34,
            rarity: 'cursed',
            description: 'Иногда помогает, иногда мешает. В среднем остаётся рискованным.',
            passive: { travelCostMultiplier: 0.92, drainMultiplier: 1.08 }
        }),
        makeItem('overloadAmulet', 'Амулет перегруза', 'AP', 5, 'artifact risk', {
            chestWeight: 1,
            baseValue: 40,
            rarity: 'cursed',
            description: 'Делает эффекты сильнее, но сильно поднимает цену шага.',
            passive: { recoveryMultiplier: 1.15, foodRecoveryMultiplier: 1.2, drainMultiplier: 1.2 }
        }),
        makeItem('sacrificeStone', 'Камень жертвы', 'KJ', 5, 'artifact risk', {
            chestWeight: 1,
            baseValue: 42,
            rarity: 'cursed',
            description: 'Усиливает многое сразу, но требует платы в расходе.',
            passive: { travelCostMultiplier: 0.85, goldLootMultiplier: 1.35, drainMultiplier: 1.18 }
        }),
        makeItem('heartOfExpedition', 'Сердце экспедиции', 'SE', 6, 'legendary survival value', {
            chestWeight: 1,
            baseValue: 64,
            rarity: 'legendary',
            description: 'Легендарный источник сил. Почти полностью возвращает форму.',
            consumable: { hunger: 100, energy: 50, focus: 40, sleep: 35, cold: 35 }
        }),
        makeItem('absoluteBridge', 'Абсолютный мост', 'AM', 6, 'legendary tool movement', {
            chestWeight: 1,
            baseValue: 70,
            rarity: 'legendary',
            description: 'Создаёт мощную переправу сразу на несколько клеток.',
            activeEffect: { kind: 'bridgeBuilder', charges: 4 }
        }),
        makeItem('omniscienceMap', 'Карта всеведения', 'KV', 6, 'legendary utility info', {
            chestWeight: 1,
            baseValue: 62,
            rarity: 'legendary',
            description: 'Полностью открывает текущий остров на карте.',
            activeEffect: { kind: 'revealMap', mode: 'fullIsland' }
        }),
        makeItem('keyOfTheWorld', 'Ключ мира', 'KM', 6, 'legendary utility', {
            chestWeight: 1,
            baseValue: 66,
            rarity: 'legendary',
            description: 'Редчайшая легендарная вещь для финальной сборки.'
        }),
        makeItem('routeCore', 'Ядро маршрута', 'YM', 6, 'legendary movement', {
            chestWeight: 1,
            baseValue: 68,
            rarity: 'legendary',
            description: 'Даёт почти бесплатное движение на несколько шагов.',
            activeEffect: { kind: 'travelBuff', discountMultiplier: 0.2, durationSteps: 12 }
        }),
        makeItem('doublePathSeal', 'Печать двойного пути', 'PD', 6, 'legendary movement', {
            chestWeight: 1,
            baseValue: 68,
            rarity: 'legendary',
            description: 'Режет стоимость маршрутов почти вдвое.',
            passive: { travelCostMultiplier: 0.5 }
        }),
        makeItem('returnSphere', 'Сфера возврата', 'SV', 6, 'legendary utility movement', {
            chestWeight: 1,
            baseValue: 64,
            rarity: 'legendary',
            description: 'Возвращает на вход острова из любой точки.',
            activeEffect: { kind: 'teleportToEntry' }
        }),
        makeItem('synergyArtifact', 'Артефакт синергии', 'AS', 6, 'legendary utility', {
            chestWeight: 1,
            baseValue: 70,
            rarity: 'legendary',
            description: 'Усиливает общий набор пассивных предметов.',
            passive: { synergyMultiplier: 1.15 }
        }),
        makeItem('luckStar', 'Звезда удачи', 'ZU', 6, 'legendary utility', {
            chestWeight: 1,
            baseValue: 68,
            rarity: 'legendary',
            description: 'Очень сильно улучшает сундуки текущего острова.',
            passive: { chestLuck: 3, goldLootMultiplier: 1.3 }
        }),
        makeItem('legendaryContainer', 'Легендарный контейнер', 'LK', 6, 'legendary utility value', {
            chestWeight: 1,
            baseValue: 72,
            rarity: 'legendary',
            description: 'Редчайшая легендарная тара. Сильный квестовый и обменный предмет.'
        }),
        makeItem('driedSnack', 'Сухой перекус', 'SK', 1, 'consumable survival food', {
            stackable: true,
            chestWeight: 10,
            merchantWeight: 10,
            baseValue: 4,
            description: 'Лёгкий перекус на ходу.',
            consumable: { hunger: 100, energy: 8 }
        }),
        ...getBaseResourceCatalogEntries(),
        ...getCraftingComponentCatalogEntries(),
        makeItem('soilClod', 'Комья земли', 'KZ', 0, 'resource material', {
            stackable: true,
            baseValue: 2,
            description: 'Сырьё из плохих секторов. Пять комьев можно сжать руками в земляной ресурс.'
        }),
        makeItem('soilResource', 'Земляной ресурс', 'ZR', 0, 'resource material value', {
            stackable: true,
            baseValue: 7,
            merchantQuestWeight: 2,
            description: 'Плотный земляной ресурс.'
        }),
        makeItem('ferryBoard', 'Доска переправы', 'DP', 2, 'tool utility movement', {
            chestWeight: 3,
            merchantWeight: 4,
            baseValue: 16,
            description: 'Старая версия переносного моста. Укладывает одну клетку моста.',
            activeEffect: { kind: 'bridgeBuilder', charges: 1 }
        }),
        makeItem('roughBridge', 'Грубый мостик', 'GM', 3, 'tool utility movement', {
            chestWeight: 2,
            merchantWeight: 3,
            baseValue: 20,
            description: 'Старая версия усиленного моста. Укладывает две клетки моста.',
            activeEffect: { kind: 'bridgeBuilder', charges: 2 }
        }),
        makeItem('leather', 'Кожа', 'KG', 1, 'material value', {
            stackable: true,
            chestWeight: 5,
            merchantWeight: 5,
            merchantQuestWeight: 6,
            baseValue: 8,
            description: 'Ремесленный материал для ранних заданий.'
        }),
        makeItem('needle', 'Игла', 'IG', 1, 'tool value', {
            stackable: true,
            chestWeight: 4,
            merchantWeight: 5,
            merchantQuestWeight: 6,
            baseValue: 9,
            description: 'Мелкая, но ценная ремесленная вещь.'
        }),
        makeItem('buckle', 'Пряжка', 'PR', 1, 'value', {
            stackable: true,
            chestWeight: 4,
            merchantWeight: 4,
            merchantQuestWeight: 5,
            baseValue: 10,
            description: 'Добротная ранняя находка.'
        }),
        makeItem('silverSpoon', 'Серебряная ложка', 'SL', 2, 'value', {
            chestWeight: 3,
            merchantQuestWeight: 4,
            baseValue: 18,
            description: 'Небольшая, но заметная ценность.'
        }),
        makeItem('wornBrooch', 'Потёртая брошь', 'BR', 2, 'value', {
            chestWeight: 3,
            merchantQuestWeight: 4,
            baseValue: 20,
            description: 'Ценность со следами прошлой жизни.'
        }),
        makeItem('carvedCasket', 'Резная шкатулка', 'RK', 3, 'value', {
            chestWeight: 2,
            merchantQuestWeight: 3,
            baseValue: 26,
            description: 'Редкая заметная ценность.'
        }),
        makeItem('copperCompass', 'Медный компас', 'MC', 3, 'tool utility value', {
            chestWeight: 2,
            merchantWeight: 2,
            merchantQuestWeight: 2,
            baseValue: 30,
            description: 'Дорогая полезная вещь для дальнего маршрута.'
        }),
        makeItem('hoarderBelt', 'Ремень запасливого', 'RZ', 3, 'value utility', {
            chestWeight: 2,
            merchantQuestWeight: 2,
            baseValue: 18,
            description: 'Широкий ремень для запасливых ходоков.'
        }),
        makeItem('merchantReceipt', 'Купеческая расписка', 'KR', 3, 'value', {
            chestWeight: 2,
            merchantQuestWeight: 3,
            baseValue: 21,
            description: 'Редкий товар и ценность для обмена.'
        }),
        makeItem('belt', 'Ремень', 'RM', 2, 'value', {
            chestWeight: 3,
            merchantQuestWeight: 3,
            baseValue: 12,
            description: 'Добротный поясной ремень.'
        }),
        makeItem('sailcloth', 'Кусок парусины', 'KP', 3, 'value material', {
            chestWeight: 2,
            merchantQuestWeight: 3,
            baseValue: 17,
            description: 'Плотная парусина из дальних тайников.'
        })
    ];

    const itemById = Object.create(null);

    function getTierByIsland(islandIndex = 1) {
        const normalized = Math.max(1, Math.round(islandIndex || 1));

        if (normalized <= 1) {
            return 0;
        }

        for (const [tier, window] of Object.entries(tierWindows)) {
            if (normalized >= window.minIsland && normalized <= window.maxIsland) {
                return Number(tier);
            }
        }

        return 6;
    }

    function rebuildItemMap() {
        Object.keys(itemById).forEach((key) => delete itemById[key]);
        items.forEach((definition) => {
            itemById[definition.id] = definition;
        });
    }

    rebuildItemMap();

    Object.assign(itemCatalog, {
        tierWindows,
        questCategoryLabels,
        items,
        itemById,
        getTierByIsland,
        rebuildItemMap
    });
})();
