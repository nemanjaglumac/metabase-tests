(ns metabase.models.timeline-test
  "Tests for the Timeline model."
  (:require [clojure.test :refer :all]
            [metabase.models.collection :refer [Collection]]
            [metabase.models.timeline :as tl :refer [Timeline]]
            [metabase.models.timeline-event :refer [TimelineEvent]]
            [metabase.test :as mt]
            [metabase.util :as u]))

(deftest timelines-for-collection-test
  (mt/with-temp Collection [collection {:name "Rasta's Collection"}]
    (let [coll-id  (u/the-id collection)
          event-names (fn [timelines]
                        (into #{} (comp (mapcat :events) (map :name)) timelines))]
      (mt/with-temp* [Timeline [tl-a {:name "tl-a" :collection_id coll-id}]
                      Timeline [tl-b {:name "tl-b" :collection_id coll-id}]
                      TimelineEvent [e-a {:timeline_id (u/the-id tl-a) :name "e-a"}]
                      TimelineEvent [e-a {:timeline_id (u/the-id tl-a) :name "e-b" :archived true}]
                      TimelineEvent [e-a {:timeline_id (u/the-id tl-b) :name "e-c"}]
                      TimelineEvent [e-a {:timeline_id (u/the-id tl-b) :name "e-d" :archived true}]]
        (testing "Fetching timelines"
          (testing "don't include events by default"
            (is (= #{}
                   (->> (tl/timelines-for-collection (u/the-id collection) {})
                        event-names))))
          (testing "include only unarchived events by default"
            (is (= #{"e-a" "e-c"}
                   (->> (tl/timelines-for-collection (u/the-id collection)
                                                     {:timeline/events? true})
                        event-names))))
          (testing "can load all events if specify `:events/all?`"
            (is (= #{"e-a" "e-b" "e-c" "e-d"}
                   (->> (tl/timelines-for-collection (u/the-id collection)
                                                     {:timeline/events? true
                                                      :events/all?      true})
                        event-names)))))))))
