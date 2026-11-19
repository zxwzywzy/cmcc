package com.zxwzywzy.tonglingbus

import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test

class ArrivalsTest {
    private val route = Route("446", "1路", 1, "起点", "终点")
    private val stops = listOf(Stop("a", "甲站"), Stop("b", "乙站"), Stop("c", "丙站"), Stop("d", "丁站"))
    private val watch = Watch(route, stops[2], 2)
    @Test fun ranksVehiclesByRemainingStops() {
        val s = Snapshot(stops, listOf(Bus("车乙", "a", true), Bus("车甲", "b", true)), 100)
        val arrivals = Arrivals.approaching(watch, s)
        assertEquals(listOf(1, 2), arrivals.map { it.gap })
        assertEquals("车甲", arrivals.first().bus.plate)
    }
    @Test fun passedVehiclesAreNotApproaching() {
        val s = Snapshot(stops, listOf(Bus("车甲", "d", true)), 100)
        assertTrue(Arrivals.approaching(watch, s).isEmpty())
        assertEquals("暂无待到站车辆", Arrivals.headline(watch, s))
    }
    @Test fun inactiveVehiclesAreNotShownAsRunning() {
        val s = Snapshot(stops, listOf(Bus("车甲", "b", false)), 100)
        assertEquals("暂无运营车辆", Arrivals.headline(watch, s))
    }
    @Test fun stationMatchDoesNotClaimExactArrival() {
        val s = Snapshot(stops, listOf(Bus("车甲", "c", true)), 100)
        assertEquals("本站附近", Arrivals.headline(watch, s))
    }
    @Test fun missingVehicleStationDoesNotInventPosition() {
        val s = Snapshot(stops, listOf(Bus("车甲", "unmatched", true)), 100)
        assertTrue(Arrivals.approaching(watch, s).isEmpty())
        assertEquals("车辆位置待确认", Arrivals.headline(watch, s))
    }
    @Test fun repeatedVehicleStationRemainsAmbiguous() {
        val loop = listOf(stops[0], stops[1], stops[0], stops[2])
        val w = Watch(route, stops[2], 3)
        assertTrue(Arrivals.approaching(w, Snapshot(loop, listOf(Bus("车甲", "a", true)), 100)).isEmpty())
    }
    @Test fun targetOccurrenceIsKeptWhenExplicitlySelected() {
        val loop = listOf(stops[0], stops[1], stops[0], stops[2])
        val w = Watch(route, stops[0], 2)
        assertEquals(2, Arrivals.targetIndex(w, Snapshot(loop, emptyList(), 100)))
    }
    @Test fun staleTargetOrdinalDoesNotPickArbitraryLoopOccurrence() {
        val loop = listOf(stops[0], stops[1], stops[0], stops[2])
        val w = Watch(route, stops[0], 1)
        assertNull(Arrivals.targetIndex(w, Snapshot(loop, emptyList(), 100)))
    }
    @Test fun changingDirectionChangesIdentity() {
        assertNotEquals(watch.key, watch.copy(route = route.copy(direction = 2)).key)
    }
    @Test fun serializingKeepsTargetOccurrenceAndTimestamp() {
        val s = Snapshot(stops, listOf(Bus("皖G12345", "b", true)), 123456789L)
        assertEquals(s, Snapshot.from(s.json()))
        assertEquals(watch, Watch.from(watch.json()))
    }
    @Test fun invalidEmptyStationListIsNotSuccess() {
        val malformed = JSONObject("""{"lineStationInfoTemp":[],"lineGpsListTemp":[]}""")
        assertThrows(IllegalArgumentException::class.java) { Snapshot.api(malformed, 100L) }
    }
    @Test fun serverSnapshotDoesNotFabricateCoordinatesOrEta() {
        val payload = JSONObject("""{"lineStationInfoTemp":[{"StationId":"a","StationName":"甲站"}],"lineGpsListTemp":[{"VehicleLicence":"皖G12345","CurrentStationId":"a","IsOperate":true}]}""")
        val s = Snapshot.api(payload, 123L)
        assertEquals(123L, s.fetchedAt)
        assertEquals("皖G12345", s.buses.single().plate)
        assertFalse(s.json().toString().contains("Latitude"))
        assertFalse(s.json().toString().contains("eta"))
    }
    @Test fun oldDataIsMarkedOnSecondaryCards() {
        val s = Snapshot(stops, listOf(Bus("车甲", "c", true)), 1000L)
        assertEquals("本站附近", Freshness.headline(watch, s, 2000L))
        assertEquals("上次 · 本站附近", Freshness.headline(watch, s, 92000L))
    }
    @Test fun failuresMarkCachedDataEvenWithinAgeWindow() {
        val s = Snapshot(stops, listOf(Bus("车甲", "c", true)), 1000L)
        assertTrue(Freshness.stale(s, 2000L, failed = true))
    }
    @Test fun clockChangesDoNotClaimFutureDataIsFresh() {
        assertTrue(Freshness.stale(Snapshot(stops, emptyList(), 5000L), 1000L))
    }
    @Test fun largeFontsDoNotForceARowIntoZeroCapacity() {
        assertEquals(0, WidgetCapacity.rows(2, 160, 220, 2f))
    }
    @Test fun compactWidgetCanShowOneRowWhenItFits() {
        assertEquals(1, WidgetCapacity.rows(0, 160, 220, 1f))
    }
    @Test fun panoramaDoesNotOverfillEvenWhenMoreRowsFit() {
        assertEquals(3, WidgetCapacity.rows(2, 280, 600, 1f))
    }
}
