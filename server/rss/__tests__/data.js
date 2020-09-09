import { modelize } from 'stubstub';

export const models = modelize`
    Community community {
        Pub p1 {
            customPublishedAt: "2020-01-03"
        } 
        Pub p2 {
            Release {
                createdAt: "2020-02-05"
            }
        }
        Pub p3 {
            Release {
                createdAt: "2020-03-09"
            }
            outboundEdges: PubEdge {
                relationType: "comment"
                pubIsParent: false
                approvedByTarget: true
                rank: "0"
                targetPub: p1
            }
        }
        Pub p4 {
            customPublishedAt: "2020-04-15"
            Release {
                createdAt: "2020-08-15"
            }
            outboundEdges: PubEdge {
                relationType: "review"
                pubIsParent: true
                approvedByTarget: false
                rank: "0"
                targetPub: p5
            }
        }
        Pub p5 {
            Release {
                createdAt: "2020-05-26"
            }
        }
        Pub p6 {
            outboundEdges: PubEdge {
                relationType: "review"
                pubIsParent: true
                approvedByTarget: true
                rank: "0"
                targetPub: p2
            }
        }
        Collection c1 {
            slug: "c1"
            isPublic: true
            CollectionPub {
                rank: "0"
                p1
            }
            CollectionPub {
                rank: "1"
                p2
            }
            CollectionPub {
                rank: "2"
                p3
            }
        }
        Collection c2 {
            slug: "c2"
            isPublic: true
            CollectionPub {
                rank: "0"
                p2
            }
            CollectionPub {
                rank: "1"
                p3
            }
            CollectionPub {
                rank: "2"
                p4
            }
        }
        Collection c3 {
            slug: "c3"
            isPublic: true
            CollectionPub {
                rank: "0"
                p3
            }
            CollectionPub {
                rank: "1"
                p4
            }
            CollectionPub {
                rank: "2"
                p5
            }
        }
    }
`;
