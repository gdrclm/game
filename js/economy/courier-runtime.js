(() => {
    const game = window.Game;
    const courierRuntime = game.systems.courierRuntime = game.systems.courierRuntime || {};

    const TIME_OF_DAY_ADVANCES_PER_DAY = 6;
    const COURIER_RETURN_ADVANCES = TIME_OF_DAY_ADVANCES_PER_DAY * 2;
    const COURIER_RESULT_LOG_LIMIT = 6;
    const COURIER_TIER_DEFINITIONS = {
        cheap: {
            id: 'cheap',
            label: 'Дешёвый',
            feeMultiplier: 0.18,
            feeBase: 4,
            quantityFee: 1,
            distanceFee: 2,
            partialRewardBaseChance: 0.52
        },
        standard: {
            id: 'standard',
            label: 'Средний',
            feeMultiplier: 0.28,
            feeBase: 8,
            quantityFee: 2,
            distanceFee: 3,
            partialRewardBaseChance: 0.4
        },
        elite: {
            id: 'elite',
            label: 'Элитный',
            feeMultiplier: 0.42,
            feeBase: 14,
            quantityFee: 3,
            distanceFee: 4,
            partialRewardBaseChance: 0.3
        }
    };

    function getQuestRuntime() {
        return game.systems.questRuntime || null;
    }

    function getInventoryRuntime() {
        return game.systems.inventoryRuntime || null;
    }

    function getUiBridge() {
        return game.systems.uiBridge || null;
    }

    function getShopRuntime() {
        return game.systems.shopRuntime || null;
    }

    function ensureCourierState() {
        game.state.courierJobsById = game.state.courierJobsById || {};
        game.state.courierResultLog = Array.isArray(game.state.courierResultLog) ? game.state.courierResultLog : [];
        game.state.timeOfDayAdvancesElapsed = Number.isFinite(game.state.timeOfDayAdvancesElapsed)
            ? Math.max(0, Math.floor(game.state.timeOfDayAdvancesElapsed))
            : 0;

        return {
            jobsById: game.state.courierJobsById,
            resultLog: game.state.courierResultLog
        };
    }

    function getCurrentTimeAdvanceCount() {
        ensureCourierState();
        return game.state.timeOfDayAdvancesElapsed;
    }

    function getCurrentIslandIndex() {
        return Number.isFinite(game.state.currentIslandIndex)
            ? game.state.currentIslandIndex
            : 1;
    }

    function getCourierTierDefinition(tierId) {
        return COURIER_TIER_DEFINITIONS[tierId] || null;
    }

    function getCourierTierDefinitions() {
        return Object.values(COURIER_TIER_DEFINITIONS).map((tier) => ({ ...tier }));
    }

    function getCurrentGold() {
        const uiBridge = getUiBridge();
        return uiBridge && typeof uiBridge.getGold === 'function'
            ? uiBridge.getGold()
            : (Number.isFinite(game.state.gold) ? game.state.gold : 0);
    }

    function changeGold(delta) {
        const uiBridge = getUiBridge();

        if (uiBridge && typeof uiBridge.changeGold === 'function') {
            return uiBridge.changeGold(delta);
        }

        game.state.gold = Math.max(0, (Number.isFinite(game.state.gold) ? game.state.gold : 0) + delta);
        return game.state.gold;
    }

    function getSourceIslandIndex(source) {
        if (source && source.expedition && Number.isFinite(source.expedition.islandIndex)) {
            return source.expedition.islandIndex;
        }

        return getCurrentIslandIndex();
    }

    function getSourceLabel(source) {
        return source && source.expedition && source.expedition.label
            ? source.expedition.label
            : 'Торговец';
    }

    function formatRewardItemSummary(itemLabel, quantity = 1) {
        const shopRuntime = getShopRuntime();
        if (shopRuntime && typeof shopRuntime.formatRewardItemSummary === 'function') {
            return shopRuntime.formatRewardItemSummary(itemLabel, quantity);
        }

        if (!itemLabel) {
            return '';
        }

        return quantity > 1 ? `${itemLabel} x${quantity}` : itemLabel;
    }

    function grantCourierRewardItem(itemId, quantity = 1, options = {}) {
        const shopRuntime = getShopRuntime();
        return shopRuntime && typeof shopRuntime.grantQuestRewardItem === 'function'
            ? shopRuntime.grantQuestRewardItem(itemId, quantity, options)
            : null;
    }

    function getQuestDeliveryDistance(quest, hireIslandIndex) {
        const questIslandIndex = Number.isFinite(quest && quest.sourceIslandIndex)
            ? quest.sourceIslandIndex
            : hireIslandIndex;
        return Math.max(0, Math.abs(hireIslandIndex - questIslandIndex));
    }

    function getCourierFee(quest, tierId, deliveryDistance = 0) {
        const tier = getCourierTierDefinition(tierId);

        if (!tier || !quest) {
            return 0;
        }

        const rewardGold = Math.max(0, Math.round(quest.rewardGold || 0));
        const quantity = Math.max(1, Math.round(quest.progressRequired || quest.quantity || 1));
        return Math.max(
            tier.feeBase,
            Math.round(
                rewardGold * tier.feeMultiplier
                + quantity * tier.quantityFee
                + deliveryDistance * tier.distanceFee
            )
        );
    }

    function getPartialRewardChance(tierId, deliveryDistance = 0) {
        const tier = getCourierTierDefinition(tierId);

        if (!tier) {
            return 0.6;
        }

        const distancePenalty = Math.max(0, deliveryDistance - 1) * 0.04;
        return Math.max(0.3, Math.min(0.6, tier.partialRewardBaseChance + distancePenalty));
    }

    function formatCourierEtaFromRemainingAdvances(remainingAdvances) {
        if (!Number.isFinite(remainingAdvances) || remainingAdvances <= 0) {
            return 'возвращается сейчас';
        }

        const remainingDays = Math.ceil(remainingAdvances / TIME_OF_DAY_ADVANCES_PER_DAY);
        const advanceLabel = remainingAdvances === 1 ? 'смена времени' : 'смен времени';
        return `через ${remainingDays} сут. · осталось ${remainingAdvances} ${advanceLabel}`;
    }

    function getRemainingAdvances(targetAdvanceCount) {
        return Math.max(0, Math.round((targetAdvanceCount || 0) - getCurrentTimeAdvanceCount()));
    }

    function buildCourierJobId(questId, tierId) {
        const randomSuffix = Math.random().toString(36).slice(2, 8);
        return `courier:${questId}:${tierId}:${getCurrentTimeAdvanceCount()}:${randomSuffix}`;
    }

    function getQuestState(questId) {
        const questRuntime = getQuestRuntime();
        return questRuntime && typeof questRuntime.getQuestStateById === 'function'
            ? questRuntime.getQuestStateById(questId)
            : null;
    }

    function setQuestState(questId, patch) {
        const questRuntime = getQuestRuntime();
        return questRuntime && typeof questRuntime.setQuestStateById === 'function'
            ? questRuntime.setQuestStateById(questId, patch)
            : null;
    }

    function decorateQuestForCourier(quest, source) {
        const inventoryRuntime = getInventoryRuntime();
        const currentGold = getCurrentGold();
        const hireIslandIndex = getSourceIslandIndex(source);
        const ownedAmount = inventoryRuntime && typeof inventoryRuntime.countInventoryItem === 'function'
            ? inventoryRuntime.countInventoryItem(quest.itemId)
            : 0;
        const deliveryDistance = getQuestDeliveryDistance(quest, hireIslandIndex);

        return {
            ...quest,
            ownedAmount,
            deliveryDistance,
            courierTiers: getCourierTierDefinitions().map((tier) => {
                const fee = getCourierFee(quest, tier.id, deliveryDistance);
                const partialRewardChance = getPartialRewardChance(tier.id, deliveryDistance);
                const hasItems = ownedAmount >= Math.max(1, quest.progressRequired || quest.quantity || 1);
                const isOwnQuest = quest.sourceHouseId && source && source.houseId && quest.sourceHouseId === source.houseId;
                let disabledReason = '';

                if (quest.completed) {
                    disabledReason = 'Задание уже закрыто.';
                } else if (quest.courierStatus === 'inTransit') {
                    disabledReason = 'Курьер уже в пути.';
                } else if (isOwnQuest) {
                    disabledReason = 'Это поручение можно сдать здесь лично.';
                } else if (!hasItems) {
                    disabledReason = 'Не хватает предметов для отправки.';
                } else if (currentGold < fee) {
                    disabledReason = `Нужно ${fee} золота.`;
                }

                return {
                    ...tier,
                    fee,
                    partialRewardChance,
                    partialRewardChancePercent: Math.round(partialRewardChance * 100),
                    disabled: Boolean(disabledReason),
                    disabledReason
                };
            })
        };
    }

    function getEligibleCourierQuests(source) {
        const questRuntime = getQuestRuntime();
        const activeQuests = questRuntime && typeof questRuntime.getActiveQuests === 'function'
            ? questRuntime.getActiveQuests()
            : [];

        return activeQuests
            .filter((quest) => (
                quest
                && quest.questType === 'merchantDelivery'
                && quest.objectiveType === 'deliverItem'
                && !quest.completed
                && quest.courierStatus !== 'inTransit'
            ))
            .map((quest) => decorateQuestForCourier(quest, source))
            .filter((quest) => !(quest.sourceHouseId && source && source.houseId && quest.sourceHouseId === source.houseId))
            .sort((left, right) => {
                const leftIsland = Number.isFinite(left.sourceIslandIndex) ? left.sourceIslandIndex : 0;
                const rightIsland = Number.isFinite(right.sourceIslandIndex) ? right.sourceIslandIndex : 0;
                return leftIsland - rightIsland || String(left.sourceLabel || '').localeCompare(String(right.sourceLabel || ''));
            });
    }

    function buildCourierJobView(job) {
        const remainingAdvances = getRemainingAdvances(job.returnAdvanceCount);
        return {
            ...job,
            remainingAdvances,
            etaLabel: formatCourierEtaFromRemainingAdvances(remainingAdvances)
        };
    }

    function getActiveCourierJobs() {
        const { jobsById } = ensureCourierState();

        return Object.values(jobsById)
            .map((job) => buildCourierJobView(job))
            .sort((left, right) => left.returnAdvanceCount - right.returnAdvanceCount);
    }

    function getCourierResultLog(limit = COURIER_RESULT_LOG_LIMIT) {
        const { resultLog } = ensureCourierState();
        return resultLog
            .slice(0, Math.max(0, limit))
            .map((entry) => ({ ...entry }));
    }

    function pushCourierResult(entry) {
        const { resultLog } = ensureCourierState();
        resultLog.unshift({ ...entry });

        if (resultLog.length > COURIER_RESULT_LOG_LIMIT) {
            resultLog.length = COURIER_RESULT_LOG_LIMIT;
        }
    }

    function getMerchantCourierDashboard(source) {
        return {
            eligibleQuests: getEligibleCourierQuests(source),
            activeJobs: getActiveCourierJobs(),
            recentResults: getCourierResultLog()
        };
    }

    function hireCourier(source, questId, tierId) {
        const inventoryRuntime = getInventoryRuntime();
        const tier = getCourierTierDefinition(tierId);
        const questState = getQuestState(questId);
        const currentGold = getCurrentGold();

        if (!source || !source.expedition || source.expedition.kind !== 'merchant') {
            return {
                success: false,
                message: 'Курьера можно нанять только у торговца.'
            };
        }

        if (!tier) {
            return {
                success: false,
                message: 'Такого курьера нет.'
            };
        }

        if (!questState || questState.questType !== 'merchantDelivery' || questState.objectiveType !== 'deliverItem') {
            return {
                success: false,
                message: 'Это поручение нельзя отправить курьером.'
            };
        }

        if (questState.completed || questState.status === 'completed') {
            return {
                success: false,
                message: 'Это поручение уже закрыто.'
            };
        }

        if (questState.courierStatus === 'inTransit') {
            return {
                success: false,
                message: 'По этому поручению курьер уже в пути.'
            };
        }

        if (questState.sourceHouseId && source.houseId && questState.sourceHouseId === source.houseId) {
            return {
                success: false,
                message: 'Это поручение можно сдать лично прямо здесь.'
            };
        }

        if (!inventoryRuntime || typeof inventoryRuntime.countInventoryItem !== 'function' || typeof inventoryRuntime.consumeInventoryItemById !== 'function') {
            return {
                success: false,
                message: 'Сумка сейчас недоступна для отправки груза.'
            };
        }

        const requiredQuantity = Math.max(1, Math.round(questState.progressRequired || questState.quantity || 1));
        const availableQuantity = inventoryRuntime.countInventoryItem(questState.itemId);

        if (availableQuantity < requiredQuantity) {
            return {
                success: false,
                message: `Не хватает предметов для отправки. Нужно ${requiredQuantity}, в сумке ${availableQuantity}.`
            };
        }

        const hireIslandIndex = getSourceIslandIndex(source);
        const deliveryDistance = getQuestDeliveryDistance(questState, hireIslandIndex);
        const fee = getCourierFee(questState, tierId, deliveryDistance);

        if (currentGold < fee) {
            return {
                success: false,
                message: `Не хватает золота на курьера. Нужно ${fee}, сейчас есть ${currentGold}.`
            };
        }

        const consumed = inventoryRuntime.consumeInventoryItemById(questState.itemId, requiredQuantity);

        if (!consumed || !consumed.success) {
            return {
                success: false,
                message: 'Не удалось собрать груз для курьера.'
            };
        }

        changeGold(-fee);

        const hiredAtAdvanceCount = getCurrentTimeAdvanceCount();
        const returnAdvanceCount = hiredAtAdvanceCount + COURIER_RETURN_ADVANCES;
        const jobId = buildCourierJobId(questState.questId, tierId);
        const { jobsById } = ensureCourierState();
        const job = {
            jobId,
            questId: questState.questId,
            questLabel: questState.label || 'Поручение торговца',
            itemId: questState.itemId,
            quantity: requiredQuantity,
            rewardGold: Math.max(0, Math.round(questState.rewardGold || 0)),
            rewardItemId: questState.rewardItemId || '',
            rewardItemLabel: questState.rewardItemLabel || '',
            rewardItemIcon: questState.rewardItemIcon || '',
            rewardItemQuantity: Math.max(0, Math.round(questState.rewardItemQuantity || 0)),
            tierId: tier.id,
            tierLabel: tier.label,
            fee,
            hireIslandIndex,
            hireSourceHouseId: source.houseId || null,
            hireSourceLabel: getSourceLabel(source),
            targetHouseId: questState.sourceHouseId || null,
            targetSourceLabel: questState.sourceLabel || 'Квестодатель',
            targetIslandIndex: Number.isFinite(questState.sourceIslandIndex) ? questState.sourceIslandIndex : hireIslandIndex,
            deliveryDistance,
            hiredAtAdvanceCount,
            returnAdvanceCount
        };

        jobsById[jobId] = job;
        setQuestState(questState.questId, {
            status: 'active',
            progressCurrent: requiredQuantity,
            courierStatus: 'inTransit',
            courierJobId: jobId,
            courierTierId: tier.id,
            courierTierLabel: tier.label,
            courierFee: fee,
            courierHireIslandIndex: hireIslandIndex,
            courierHireSourceLabel: getSourceLabel(source),
            courierDeliveryDistance: deliveryDistance,
            courierHiredAtAdvanceCount: hiredAtAdvanceCount,
            courierReturnAdvanceCount: returnAdvanceCount,
            courierResultCode: '',
            courierResultLabel: `Курьер "${tier.label}" в пути к ${job.targetSourceLabel}. Вернётся через 2 суток.`
        });

        return {
            success: true,
            job: buildCourierJobView(job),
            message: `Курьер "${tier.label}" забрал ${job.questLabel.toLowerCase()} и вернётся через 2 суток. Комиссия: ${fee} золота.`
        };
    }

    function buildCourierResolution(job) {
        const currentIslandIndex = getCurrentIslandIndex();
        const distanceFromHireIsland = Math.abs(currentIslandIndex - job.hireIslandIndex);
        let rewardRatio = 0;
        let resultCode = 'lost';

        if (distanceFromHireIsland === 0) {
            rewardRatio = 1;
            resultCode = 'full';
        } else if (distanceFromHireIsland <= 2) {
            const partialRewardChance = getPartialRewardChance(job.tierId, job.deliveryDistance);
            const gotPartialReward = Math.random() < partialRewardChance;
            rewardRatio = gotPartialReward ? 0.5 : 1;
            resultCode = gotPartialReward ? 'partial' : 'full';
        }

        const deliveredRewardGold = Math.max(0, Math.round(job.rewardGold * rewardRatio));
        if (deliveredRewardGold > 0) {
            changeGold(deliveredRewardGold);
        }

        const rewardItemGrant = resultCode !== 'lost' && job.rewardItemId
            ? grantCourierRewardItem(job.rewardItemId, job.rewardItemQuantity || 1, {
                label: job.rewardItemLabel,
                icon: job.rewardItemIcon
            })
            : null;
        const rewardItemSummary = formatRewardItemSummary(job.rewardItemLabel, job.rewardItemQuantity || 1);
        const rewardItemMessage = rewardItemGrant && rewardItemGrant.granted
            ? (rewardItemGrant.droppedQuantity > 0
                ? ` Бонус "${rewardItemSummary}" не поместился в сумку и лежит под ногами.`
                : ` Бонус: ${rewardItemSummary}.`)
            : (resultCode === 'lost' && rewardItemSummary ? ` Редкий бонус "${rewardItemSummary}" тоже потерян.` : '');

        let message = '';
        if (resultCode === 'full') {
            message = `Курьер "${job.tierLabel}" вернулся от ${job.targetSourceLabel}: награда за "${job.questLabel}" получена полностью, +${deliveredRewardGold} золота.`;
        } else if (resultCode === 'partial') {
            message = `Курьер "${job.tierLabel}" вернулся от ${job.targetSourceLabel}, но из-за дальнего отхода удалось сохранить только половину золотой части награды: +${deliveredRewardGold} золота.`;
        } else {
            message = `Курьер "${job.tierLabel}" не довёз награду за "${job.questLabel}": ты ушёл слишком далеко от острова найма.`;
        }
        message += rewardItemMessage;

        return {
            ...job,
            currentIslandIndex,
            distanceFromHireIsland,
            deliveredRewardGold,
            rewardItemGrant,
            rewardRatio,
            resultCode,
            message
        };
    }

    function resolveCourierJob(job) {
        const { jobsById } = ensureCourierState();
        const resolution = buildCourierResolution(job);

        delete jobsById[job.jobId];
        setQuestState(job.questId, {
            status: 'completed',
            completed: true,
            progressCurrent: Math.max(1, Math.round(job.quantity || 1)),
            completedAtIslandIndex: getCurrentIslandIndex(),
            courierStatus: 'resolved',
            courierJobId: job.jobId,
            courierTierId: job.tierId,
            courierTierLabel: job.tierLabel,
            courierFee: job.fee,
            courierDeliveryDistance: job.deliveryDistance,
            courierHireIslandIndex: job.hireIslandIndex,
            courierHireSourceLabel: job.hireSourceLabel,
            courierResolvedAtAdvanceCount: getCurrentTimeAdvanceCount(),
            courierReturnAdvanceCount: job.returnAdvanceCount,
            courierResultCode: resolution.resultCode,
            courierResultRatio: resolution.rewardRatio,
            courierResultLabel: resolution.message,
            deliveredRewardGold: resolution.deliveredRewardGold,
            deliveredRewardItemId: resolution.rewardItemGrant && resolution.rewardItemGrant.granted ? job.rewardItemId : '',
            deliveredRewardItemLabel: resolution.rewardItemGrant && resolution.rewardItemGrant.granted ? job.rewardItemLabel : '',
            deliveredRewardItemQuantity: resolution.rewardItemGrant && resolution.rewardItemGrant.granted
                ? ((resolution.rewardItemGrant.item && resolution.rewardItemGrant.item.quantity) || (job.rewardItemQuantity || 1))
                : 0,
            deliveredRewardItemDropped: Boolean(resolution.rewardItemGrant && resolution.rewardItemGrant.droppedQuantity > 0)
        });

        pushCourierResult({
            resultId: `courier-result:${job.jobId}`,
            questId: job.questId,
            questLabel: job.questLabel,
            targetSourceLabel: job.targetSourceLabel,
            tierId: job.tierId,
            tierLabel: job.tierLabel,
            deliveryDistance: job.deliveryDistance,
            distanceFromHireIsland: resolution.distanceFromHireIsland,
            deliveredRewardGold: resolution.deliveredRewardGold,
            deliveredRewardItemLabel: resolution.rewardItemGrant && resolution.rewardItemGrant.granted ? job.rewardItemLabel : '',
            deliveredRewardItemQuantity: resolution.rewardItemGrant && resolution.rewardItemGrant.granted
                ? ((resolution.rewardItemGrant.item && resolution.rewardItemGrant.item.quantity) || (job.rewardItemQuantity || 1))
                : 0,
            deliveredRewardItemDropped: Boolean(resolution.rewardItemGrant && resolution.rewardItemGrant.droppedQuantity > 0),
            rewardRatio: resolution.rewardRatio,
            resultCode: resolution.resultCode,
            message: resolution.message
        });

        return resolution;
    }

    function processDueCourierJobs() {
        const dueJobs = getActiveCourierJobs().filter((job) => job.returnAdvanceCount <= getCurrentTimeAdvanceCount());

        if (dueJobs.length === 0) {
            return {
                resolvedJobs: [],
                messages: []
            };
        }

        const resolvedJobs = dueJobs.map((job) => resolveCourierJob(job));
        return {
            resolvedJobs,
            messages: resolvedJobs.map((job) => job.message).filter(Boolean)
        };
    }

    Object.assign(courierRuntime, {
        TIME_OF_DAY_ADVANCES_PER_DAY,
        COURIER_RETURN_ADVANCES,
        ensureCourierState,
        getCurrentTimeAdvanceCount,
        getCourierTierDefinitions,
        getCourierFee,
        getPartialRewardChance,
        formatCourierEtaFromRemainingAdvances,
        getEligibleCourierQuests,
        getActiveCourierJobs,
        getCourierResultLog,
        getMerchantCourierDashboard,
        hireCourier,
        processDueCourierJobs
    });
})();
