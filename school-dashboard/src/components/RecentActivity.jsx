import { Card, CardBody, CardHeader, Chip, Divider, Tabs, Tab } from "@heroui/react";
import { Activity, IndianRupee, Megaphone, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function RecentActivity({ payments, announcements, communications }) {
  const navigate = useNavigate();
  return (
    <Card className="shadow-sm border border-default-200 bg-content1/50 backdrop-blur-sm rounded-2xl">
      <CardHeader className="flex gap-2 px-5 py-4">
        <div className="p-1.5 bg-secondary/10 rounded-lg text-secondary">
          <Activity size={18} />
        </div>
        <div>
          <h3 className="text-base font-medium text-default-900">Recent Activity</h3>
          <p className="text-tiny text-default-500">Latest updates and logs</p>
        </div>
      </CardHeader>
      <Divider className="bg-default-200" />
      <CardBody className="p-4">
        <Tabs aria-label="Activity tabs" color="secondary" variant="solid" radius="sm" classNames={{ tabList: "bg-default-100/50" }} size="sm">
          <Tab
            key="payments"
            title={
              <div className="flex items-center gap-1.5">
                <IndianRupee size={14} />
                <span className="text-xs">Payments</span>
              </div>
            }
          >
            <div className="space-y-1.5 mt-2">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-default-100/50 hover:bg-default-200/50 transition-colors cursor-pointer"
                >
                  <div>
                    <p
                      className="font-medium text-xs text-foreground hover:text-primary hover:underline cursor-pointer"
                      onClick={() => navigate(`/students/${payment.id}`)}
                    >
                      {payment.student}
                    </p>
                    <p className="text-[10px] text-default-500">Class {payment.class}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-xs text-success">₹{payment.amount.toLocaleString()}</p>
                    <p className="text-[10px] text-default-400">{payment.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Tab>
          <Tab
            key="announcements"
            title={
              <div className="flex items-center gap-1.5">
                <Megaphone size={14} />
                <span className="text-xs">Announcements</span>
              </div>
            }
          >
            <div className="space-y-1.5 mt-2">
              {announcements.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-default-100/50 hover:bg-default-200/50 transition-colors cursor-pointer"
                >
                  <div>
                    <p className="font-medium text-xs">{item.title}</p>
                    <p className="text-[10px] text-default-500">To: {item.recipients}</p>
                  </div>
                  <Chip size="sm" variant="flat">{item.date}</Chip>
                </div>
              ))}
            </div>
          </Tab>
          <Tab
            key="communications"
            title={
              <div className="flex items-center gap-1.5">
                <MessageSquare size={14} />
                <span className="text-xs">Communications</span>
              </div>
            }
          >
            <div className="space-y-1.5 mt-2">
              {communications.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-default-100/50 hover:bg-default-200/50 transition-colors cursor-pointer"
                >
                  <div>
                    <p className="font-medium text-xs">{item.parent}</p>
                    <p className="text-[10px] text-default-500">{item.subject}</p>
                  </div>
                  <Chip
                    size="sm"
                    color={item.status === "resolved" ? "success" : "warning"}
                    variant="flat"
                  >
                    {item.status}
                  </Chip>
                </div>
              ))}
            </div>
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  );
}
